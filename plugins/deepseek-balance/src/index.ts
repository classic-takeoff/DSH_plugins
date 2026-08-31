/**
 * `@deepseek-ai/dsh-deepseek-balance` host half: a `deepseekBalance` Remote
 * namespace that reads the user's DeepSeek balance from the official
 * Get User Balance endpoint (`GET {baseURL}/user/balance`,
 * https://api-docs.deepseek.com/api/get-user-balance) behind a short-lived
 * snapshot cache, plus the plugin's `deepseek-balance` settings section.
 *
 * The API key is a *reference*, resolved per request through the credential
 * seam (`ctx.credentials`) exactly like the `llm-deepseek` adapter — the key
 * never lives in configuration and never crosses the Remote wire; only the
 * configured/available fact does. A fetch failure, a missing key, or a
 * malformed response surfaces as a typed Remote failure the browser widget
 * renders, never as a crash.
 *
 * @module @deepseek-ai/dsh-deepseek-balance
 */

import type { Context } from '@deepseek-ai/cordis'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type {} from '@deepseek-ai/dsh-settings'
import { Remote, RemoteError, remoteErrorOf, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import z from '@deepseek-ai/schemastery'
import {
  BALANCE_ENDPOINT_PATH,
  DEFAULT_API_KEY_ENV,
  DEFAULT_AUTO_REFRESH,
  DEFAULT_BASE_URL,
  DEFAULT_CACHE_TTL_MS,
  DEFAULT_REFRESH_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
  MAX_PERIOD_MS,
  NS,
} from './constants.ts'
import type { BalanceOptionsView, BalanceCurrencyView, BalanceSnapshot } from './types.ts'

export type {
  BalanceCurrencyView,
  BalanceOptionsView,
  BalanceSnapshot,
} from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Host balance service registered by this bundle. */
    deepseekBalance: BalanceController
  }
}

/** Cordis plugin name; also the patch row id in `cordis.patch.yml`. */
export const name = 'deepseek-balance'

/**
 * Plugin configuration, validated by the same-named schemastery schema and
 * doubling as the `deepseek-balance` settings-section shape. Every field is
 * optional in yml: `apiKeyEnv` falls back to `DEEPSEEK_API_KEY`, the endpoint
 * to the public API, and the periods to the constants in `constants.ts`.
 */
export interface Config {
  /** Credential reference (environment-variable name) resolved per request. */
  apiKeyEnv?: string
  /** API origin; `/user/balance` is appended. */
  baseURL?: string
  /** Whether the browser widget auto-refreshes. */
  autoRefresh?: boolean
  /** Browser auto-refresh interval in milliseconds. */
  refreshIntervalMs?: number
  /** Host snapshot cache TTL in milliseconds; `0` disables the cache. */
  cacheTtlMs?: number
  /** Per-request HTTP timeout in milliseconds. */
  timeoutMs?: number
}

/** The settings schema; a `role('credential-ref')` field keeps the key name off secret redaction surfaces. */
export const Config: z<Config> = z.object({
  apiKeyEnv: z.string().role('credential-ref').default(DEFAULT_API_KEY_ENV),
  baseURL: z.string().default(DEFAULT_BASE_URL),
  autoRefresh: z.boolean().default(DEFAULT_AUTO_REFRESH),
  refreshIntervalMs: z.number().step(1).min(1_000).max(MAX_PERIOD_MS).default(DEFAULT_REFRESH_INTERVAL_MS),
  cacheTtlMs: z.number().step(1).min(0).max(MAX_PERIOD_MS).default(DEFAULT_CACHE_TTL_MS),
  timeoutMs: z.number().step(1).min(1_000).max(MAX_PERIOD_MS).default(DEFAULT_TIMEOUT_MS),
})

/** Official wire body for `GET /user/balance` (snake_case, string balances). */
interface WireBalanceResponse {
  readonly is_available?: unknown
  readonly balance_infos?: readonly unknown[]
}

/** One official `balance_infos` entry. */
interface WireBalanceInfo {
  readonly currency?: unknown
  readonly total_balance?: unknown
  readonly granted_balance?: unknown
  readonly topped_up_balance?: unknown
}

/** Resolve one config snapshot into validated request facts. */
function resolveConfig(config: Config): Required<Config> {
  const apiKeyEnv = config.apiKeyEnv ?? DEFAULT_API_KEY_ENV
  return {
    apiKeyEnv,
    baseURL: trimTrailingSlash(config.baseURL ?? DEFAULT_BASE_URL),
    autoRefresh: config.autoRefresh ?? DEFAULT_AUTO_REFRESH,
    refreshIntervalMs: config.refreshIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS,
    cacheTtlMs: config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS,
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  }
}

/** Strip one trailing slash so `${baseURL}${BALANCE_ENDPOINT_PATH}` never doubles a separator. */
function trimTrailingSlash(value: string): string {
  return value.length > 1 && value.endsWith('/') ? value.slice(0, -1) : value
}

/** Coerce one wire field to its decimal string, or `0.00` when absent/malformed. */
function decimalString(value: unknown): string {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return '0.00'
}

/** Map the official snake_case body onto the normalized snapshot shape. */
function normalizeBalance(body: unknown, fetchedAt: string): BalanceSnapshot {
  const wire = body as WireBalanceResponse
  const infos = Array.isArray(wire.balance_infos) ? wire.balance_infos : []
  const currencies: BalanceCurrencyView[] = []
  for (const entry of infos) {
    const info = entry as WireBalanceInfo
    if (typeof info.currency !== 'string' || info.currency.length === 0) continue
    currencies.push({
      currency: info.currency,
      totalBalance: decimalString(info.total_balance),
      grantedBalance: decimalString(info.granted_balance),
      toppedUpBalance: decimalString(info.topped_up_balance),
    })
  }
  return {
    isAvailable: wire.is_available !== false,
    fetchedAt,
    currencies,
  }
}

/**
 * Host service backing the `ctx.remote.deepseekBalance` namespace. Discovered
 * by the Gateway's SRC fallback from the live `@Remote` markers; the three
 * zero-argument methods keep the wire contract free of optional-argument
 * parsing. Snapshot reads ride a short TTL cache with in-flight dedup, so a
 * chatty browser widget never hammers the official API.
 */
export class BalanceController extends TypertRemoteService {
  private cache: { readonly snapshot: BalanceSnapshot; readonly at: number } | undefined
  private inflight: Promise<BalanceSnapshot> | undefined

  /**
   * @param ctx - the plugin's Host context; the service registers as `deepseekBalance`.
   * @param current - live config resolver (settings snapshot source).
   * @param fetchBalance - injectable transport for unit tests; defaults to the global fetch.
   */
  constructor(
    ctx: Context,
    private readonly current: () => Config,
    private readonly fetchBalance: (
      url: string,
      init: { readonly headers: Record<string, string>; readonly signal: AbortSignal },
    ) => Promise<Response> = globalThis.fetch,
  ) {
    super(ctx, 'deepseekBalance')
  }

  /** Drop the cached snapshot; the settings `onChange` hook calls this so the next read sees new config. */
  clearCache(): void {
    this.cache = undefined
  }

  /**
   * Fetch the current balance snapshot, serving the TTL cache when fresh.
   * @returns the normalized snapshot.
   */
  @Remote
  async getBalance(): Promise<BalanceSnapshot> {
    const config = resolveConfig(this.current())
    const cached = this.cache
    if (cached !== undefined && config.cacheTtlMs > 0 && Date.now() - cached.at < config.cacheTtlMs) {
      return cached.snapshot
    }
    return this.fetchOrDedupe(config)
  }

  /**
   * Fetch a fresh balance snapshot, bypassing the cache.
   * @returns the normalized snapshot.
   */
  @Remote
  async refreshBalance(): Promise<BalanceSnapshot> {
    return this.fetchOrDedupe(resolveConfig(this.current()))
  }

  /**
   * Resolve the plugin options and whether a usable key resolves.
   * @returns the resolved options view — never the key itself.
   */
  @Remote
  async getOptions(): Promise<BalanceOptionsView> {
    const config = resolveConfig(this.current())
    return {
      apiKeyEnv: config.apiKeyEnv,
      baseURL: config.baseURL,
      autoRefresh: config.autoRefresh,
      refreshIntervalMs: config.refreshIntervalMs,
      cacheTtlMs: config.cacheTtlMs,
      keyConfigured: (await this.resolveKey(config)) !== undefined,
    }
  }

  /** Share one in-flight fetch across concurrent callers; failures are not cached. */
  private fetchOrDedupe(config: Required<Config>): Promise<BalanceSnapshot> {
    if (this.inflight !== undefined) return this.inflight
    const run = this.fetchAndCache(config)
    this.inflight = run
    const clear = (): void => {
      if (this.inflight === run) this.inflight = undefined
    }
    void run.then(clear, clear)
    return run
  }

  private async fetchAndCache(config: Required<Config>): Promise<BalanceSnapshot> {
    const snapshot = await this.fetchSnapshot(config)
    this.cache = { snapshot, at: Date.now() }
    return snapshot
  }

  private async fetchSnapshot(config: Required<Config>): Promise<BalanceSnapshot> {
    const key = await this.resolveKey(config)
    if (key === undefined) {
      throw new RemoteError(
        'deepseek-balance/missing-credential',
        `deepseek-balance: no API key for "${config.apiKeyEnv}"; store it through the credentials`
        + ' service (the web Models page writes it) or export it in the launching environment',
        { ref: config.apiKeyEnv },
      )
    }
    try {
      const response = await this.fetchBalance(`${config.baseURL}${BALANCE_ENDPOINT_PATH}`, {
        headers: {
          authorization: `Bearer ${key}`,
          accept: 'application/json',
        },
        signal: AbortSignal.timeout(config.timeoutMs),
      })
      if (!response.ok) {
        throw new RemoteError(
          'deepseek-balance/api-error',
          `deepseek-balance: the balance endpoint returned HTTP ${String(response.status)}`,
          { status: response.status },
        )
      }
      const body: unknown = await response.json()
      return normalizeBalance(body, new Date().toISOString())
    } catch (error) {
      if (remoteErrorOf(error) !== undefined) throw error
      throw new RemoteError(
        'deepseek-balance/api-error',
        `deepseek-balance: balance request failed: ${error instanceof Error ? error.message : String(error)}`,
        {},
        { cause: error },
      )
    }
  }

  /** Resolve the API key for the current config through the credential seam. */
  private async resolveKey(config: Required<Config>): Promise<string | undefined> {
    const credentials = this.ctx.get('credentials')
    if (credentials === undefined) return undefined
    const hit = await credentials.resolve(credentialRef(config.apiKeyEnv))
    return hit !== undefined && hit.value.length > 0 ? hit.value : undefined
  }
}

/**
 * Mount the balance controller and the settings section.
 * @param ctx - Host context (the web composition carries the settings and credentials seams).
 * @param config - loader-provided plugin configuration.
 */
export function apply(ctx: Context, config: Config): void {
  let current: () => Config = () => config
  const controller = new BalanceController(ctx, () => current())
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, NS, Config, config, {
      // A live settings snapshot replaces the loader config; the resolver is
      // re-read per Remote call, so an edit reaches the next request.
      setSource: (source) => { current = source },
      // Config facts changed: the next read must not serve a stale snapshot.
      onChange: () => { controller.clearCache() },
    })
  })
}
