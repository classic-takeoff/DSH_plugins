/**
 * Wire types for `@deepseek-ai/dsh-deepseek-balance`. The snapshot mirrors the
 * official Get User Balance response (https://api-docs.deepseek.com/api/get-user-balance)
 * normalized into camelCase with a server-side `fetchedAt` timestamp; string
 * balances stay strings so the exact decimal values survive display formatting.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/types
 */
/** One currency's balance entry, mapped from `balance_infos[]`. */
export interface BalanceCurrencyView {
    /** Balance currency, `CNY` or `USD` on the public API. */
    readonly currency: string;
    /** Total available balance, including granted and topped-up balance. */
    readonly totalBalance: string;
    /** Total not-expired granted balance. */
    readonly grantedBalance: string;
    /** Total topped-up balance. */
    readonly toppedUpBalance: string;
}
/** Normalized balance snapshot returned by the `deepseekBalance` Remote methods. */
export interface BalanceSnapshot {
    /** Whether the user's balance is sufficient for API calls (`is_available`). */
    readonly isAvailable: boolean;
    /** Host-side fetch completion time, ISO 8601. */
    readonly fetchedAt: string;
    /** One entry per reported currency. */
    readonly currencies: readonly BalanceCurrencyView[];
}
/** Resolved plugin options surfaced to the browser (never secrets). */
export interface BalanceOptionsView {
    /** Credential reference (environment-variable name) used for the fetch. */
    readonly apiKeyEnv: string;
    /** API origin the balance request targets. */
    readonly baseURL: string;
    /** Whether the browser widget auto-refreshes. */
    readonly autoRefresh: boolean;
    /** Browser auto-refresh interval in milliseconds. */
    readonly refreshIntervalMs: number;
    /** Host snapshot cache TTL in milliseconds. */
    readonly cacheTtlMs: number;
    /** Whether a usable API key resolves for the configured reference. */
    readonly keyConfigured: boolean;
}
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface RemoteErrorDetailsMap {
        /** No usable API key resolved for the configured credential reference. */
        'deepseek-balance/missing-credential': {
            readonly ref: string;
        };
        /** The balance endpoint rejected the request or the response was malformed. */
        'deepseek-balance/api-error': {
            readonly status?: number;
        };
    }
}
//# sourceMappingURL=types.d.ts.map