/**
 * Host-half spec for `@deepseek-ai/dsh-deepseek-balance`: wire normalization
 * against the official Get User Balance shape, snapshot caching with in-flight
 * dedup, credential resolution through the seam, typed failure mapping, and
 * the plugin mount. No network: the transport is injected.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { remoteErrorOf, remoteMethods } from '@deepseek-ai/dsh-typert-protocol'
import { BalanceController, Config, apply } from '../src/index.ts'
import { MemoryCredentials } from '../../../credentials/credentials/tests/memory.ts'

/** Official wire body from the Get User Balance reference. */
const WIRE_BODY = {
  is_available: true,
  balance_infos: [
    { currency: 'CNY', total_balance: '110.00', granted_balance: '10.00', topped_up_balance: '100.00' },
    { currency: 'USD', total_balance: '0.00', granted_balance: '0.00', topped_up_balance: '0.00' },
  ],
}

type FetchSpy = ReturnType<typeof vi.fn>

/** Build a fake transport returning `body` with `status`. */
function fakeFetch(body: unknown, status = 200): FetchSpy {
  return vi.fn(async () => new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  }))
}

interface Boot {
  ctx: Context
  controller: BalanceController
  fetch: FetchSpy
  /** Rotate the config snapshot the controller reads. */
  setConfig: (config: Record<string, unknown>) => void
}

async function boot(config: Record<string, unknown> = {}, seededKey?: string): Promise<Boot> {
  const ctx = new Context()
  if (seededKey !== undefined) await ctx.plugin(MemoryCredentials, { DEEPSEEK_API_KEY: seededKey })
  let current = { ...config }
  const fetch = fakeFetch(WIRE_BODY)
  const controller = new BalanceController(ctx, () => current, fetch as never)
  return {
    ctx,
    controller,
    fetch,
    setConfig: (next) => { current = { ...next } },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BalanceController Remote surface', () => {
  it('publishes the deepseekBalance namespace with the three zero-argument methods', async () => {
    const { controller } = await boot()
    expect(controller.typertRemote.serviceKey).toBe('deepseekBalance')
    expect(controller.typertRemote.namespace).toBe('deepseekBalance')
    expect(remoteMethods(controller)).toEqual([
      { method: 'getBalance', invocation: { kind: 'direct' } },
      { method: 'refreshBalance', invocation: { kind: 'direct' } },
      { method: 'getOptions', invocation: { kind: 'direct' } },
    ])
  })

  it('fetches the official endpoint with the bearer key and normalizes the wire body', async () => {
    const { controller, fetch } = await boot({}, 'sk-live')
    const snapshot = await controller.getBalance()
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.deepseek.com/user/balance')
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer sk-live')
    expect(snapshot.isAvailable).toBe(true)
    expect(snapshot.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(snapshot.currencies).toEqual([
      { currency: 'CNY', totalBalance: '110.00', grantedBalance: '10.00', toppedUpBalance: '100.00' },
      { currency: 'USD', totalBalance: '0.00', grantedBalance: '0.00', toppedUpBalance: '0.00' },
    ])
    expect(snapshot.currencies[0]?.totalBalance).toBe('110.00')
  })

  it('serves the cached snapshot within the TTL and bypasses it on refresh', async () => {
    const { controller, fetch } = await boot({ cacheTtlMs: 60_000 }, 'sk-live')
    await controller.getBalance()
    await controller.getBalance()
    expect(fetch).toHaveBeenCalledTimes(1)
    await controller.refreshBalance()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('dedupes concurrent callers into one fetch', async () => {
    const { controller, fetch } = await boot({ cacheTtlMs: 0 }, 'sk-live')
    await Promise.all([controller.getBalance(), controller.getBalance(), controller.getBalance()])
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('drops the cache on clearCache (the settings onChange hook)', async () => {
    const { controller, fetch, setConfig } = await boot({ cacheTtlMs: 60_000 }, 'sk-live')
    await controller.getBalance()
    setConfig({ cacheTtlMs: 60_000, baseURL: 'https://gateway.internal' })
    controller.clearCache()
    await controller.getBalance()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect((fetch.mock.calls[1] as [string])[0]).toBe('https://gateway.internal/user/balance')
  })

  it('reports a missing credential as a typed Remote failure without a fetch', async () => {
    const { controller, fetch } = await boot()
    const failure = await controller.getBalance().catch((error: unknown) => error)
    expect(remoteErrorOf(failure)).toMatchObject({
      code: 'deepseek-balance/missing-credential',
      details: { ref: 'DEEPSEEK_API_KEY' },
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('maps a non-2xx response to an api-error carrying the status', async () => {
    const ctx = new Context()
    await ctx.plugin(MemoryCredentials, { DEEPSEEK_API_KEY: 'sk-live' })
    const fetch = fakeFetch({ error: { message: 'invalid api key' } }, 401)
    const controller = new BalanceController(ctx, () => ({}), fetch as never)
    const failure = await controller.getBalance().catch((error: unknown) => error)
    expect(remoteErrorOf(failure)).toMatchObject({
      code: 'deepseek-balance/api-error',
      details: { status: 401 },
    })
  })

  it('normalizes malformed wire entries defensively', async () => {
    const ctx = new Context()
    await ctx.plugin(MemoryCredentials, { DEEPSEEK_API_KEY: 'sk-live' })
    const fetch = fakeFetch({
      is_available: false,
      balance_infos: [
        { currency: 'CNY' },
        { total_balance: '9.90' },
        'not-an-object',
      ],
    })
    const controller = new BalanceController(ctx, () => ({}), fetch as never)
    const snapshot = await controller.getBalance()
    expect(snapshot.isAvailable).toBe(false)
    expect(snapshot.currencies).toEqual([
      { currency: 'CNY', totalBalance: '0.00', grantedBalance: '0.00', toppedUpBalance: '0.00' },
    ])
  })

  it('reports resolved options and credential availability without the key', async () => {
    const { controller } = await boot({ autoRefresh: false }, 'sk-secret')
    const options = await controller.getOptions()
    expect(options).toEqual({
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      baseURL: 'https://api.deepseek.com',
      autoRefresh: false,
      refreshIntervalMs: 600_000,
      cacheTtlMs: 30_000,
      keyConfigured: true,
    })
    expect(JSON.stringify(options)).not.toContain('sk-secret')
  })

  it('reports an unconfigured key in getOptions', async () => {
    const { controller } = await boot()
    const options = await controller.getOptions()
    expect(options.keyConfigured).toBe(false)
  })
})

describe('plugin apply', () => {
  it('mounts the deepseekBalance service from the plugin module', async () => {
    const fetch = fakeFetch(WIRE_BODY)
    vi.stubGlobal('fetch', fetch)
    const ctx = new Context()
    await ctx.plugin(MemoryCredentials, { DEEPSEEK_API_KEY: 'sk-live' })
    await ctx.plugin({ name: 'deepseek-balance', apply, Config })
    const controller = ctx.deepseekBalance
    expect(controller).toBeInstanceOf(BalanceController)
    const snapshot = await controller.getBalance()
    expect(snapshot.isAvailable).toBe(true)
  })
})
