/**
 * Shared constants for `@deepseek-ai/dsh-deepseek-balance`: the settings
 * namespace, default option values, and the official DeepSeek balance endpoint
 * (https://api-docs.deepseek.com/api/get-user-balance). Kept in one file so
 * the Host and browser halves cannot disagree about a default or the
 * namespace key.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/constants
 */
/** Settings namespace and browser card key for this plugin. */
export declare const NS = "deepseek-balance";
/** Credential reference resolved per request; defaults to the standard DeepSeek key name. */
export declare const DEFAULT_API_KEY_ENV = "DEEPSEEK_API_KEY";
/** Official public API origin; the balance endpoint appends `/user/balance`. */
export declare const DEFAULT_BASE_URL = "https://api.deepseek.com";
/** Balance endpoint path per the official Get User Balance reference. */
export declare const BALANCE_ENDPOINT_PATH = "/user/balance";
/** Whether the browser widget auto-refreshes out of the box. */
export declare const DEFAULT_AUTO_REFRESH = true;
/** Default auto-refresh interval in milliseconds (ten minutes). */
export declare const DEFAULT_REFRESH_INTERVAL_MS = 600000;
/** Default host-side snapshot cache TTL in milliseconds (thirty seconds). */
export declare const DEFAULT_CACHE_TTL_MS = 30000;
/** Default per-request HTTP timeout in milliseconds (ten seconds). */
export declare const DEFAULT_TIMEOUT_MS = 10000;
/** Maximum interval/TTL/timeout accepted by the settings schema. */
export declare const MAX_PERIOD_MS = 86400000;
//# sourceMappingURL=constants.d.ts.map