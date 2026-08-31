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
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import z from '@deepseek-ai/schemastery';
import type { BalanceOptionsView, BalanceSnapshot } from './types.ts';
export type { BalanceCurrencyView, BalanceOptionsView, BalanceSnapshot, } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        /** Host balance service registered by this bundle. */
        deepseekBalance: BalanceController;
    }
}
/** Cordis plugin name; also the patch row id in `cordis.patch.yml`. */
export declare const name = "deepseek-balance";
/**
 * Plugin configuration, validated by the same-named schemastery schema and
 * doubling as the `deepseek-balance` settings-section shape. Every field is
 * optional in yml: `apiKeyEnv` falls back to `DEEPSEEK_API_KEY`, the endpoint
 * to the public API, and the periods to the constants in `constants.ts`.
 */
export interface Config {
    /** Credential reference (environment-variable name) resolved per request. */
    apiKeyEnv?: string;
    /** API origin; `/user/balance` is appended. */
    baseURL?: string;
    /** Whether the browser widget auto-refreshes. */
    autoRefresh?: boolean;
    /** Browser auto-refresh interval in milliseconds. */
    refreshIntervalMs?: number;
    /** Host snapshot cache TTL in milliseconds; `0` disables the cache. */
    cacheTtlMs?: number;
    /** Per-request HTTP timeout in milliseconds. */
    timeoutMs?: number;
}
/** The settings schema; a `role('credential-ref')` field keeps the key name off secret redaction surfaces. */
export declare const Config: z<Config>;
/**
 * Host service backing the `ctx.remote.deepseekBalance` namespace. Discovered
 * by the Gateway's SRC fallback from the live `@Remote` markers; the three
 * zero-argument methods keep the wire contract free of optional-argument
 * parsing. Snapshot reads ride a short TTL cache with in-flight dedup, so a
 * chatty browser widget never hammers the official API.
 */
export declare class BalanceController extends TypertRemoteService {
    private readonly current;
    private readonly fetchBalance;
    private cache;
    private inflight;
    /**
     * @param ctx - the plugin's Host context; the service registers as `deepseekBalance`.
     * @param current - live config resolver (settings snapshot source).
     * @param fetchBalance - injectable transport for unit tests; defaults to the global fetch.
     */
    constructor(ctx: Context, current: () => Config, fetchBalance?: (url: string, init: {
        readonly headers: Record<string, string>;
        readonly signal: AbortSignal;
    }) => Promise<Response>);
    /** Drop the cached snapshot; the settings `onChange` hook calls this so the next read sees new config. */
    clearCache(): void;
    /**
     * Fetch the current balance snapshot, serving the TTL cache when fresh.
     * @returns the normalized snapshot.
     */
    getBalance(): Promise<BalanceSnapshot>;
    /**
     * Fetch a fresh balance snapshot, bypassing the cache.
     * @returns the normalized snapshot.
     */
    refreshBalance(): Promise<BalanceSnapshot>;
    /**
     * Resolve the plugin options and whether a usable key resolves.
     * @returns the resolved options view — never the key itself.
     */
    getOptions(): Promise<BalanceOptionsView>;
    /** Share one in-flight fetch across concurrent callers; failures are not cached. */
    private fetchOrDedupe;
    private fetchAndCache;
    private fetchSnapshot;
    /** Resolve the API key for the current config through the credential seam. */
    private resolveKey;
}
/**
 * Mount the balance controller and the settings section.
 * @param ctx - Host context (the web composition carries the settings and credentials seams).
 * @param config - loader-provided plugin configuration.
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map