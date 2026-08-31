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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { credentialRef } from '@deepseek-ai/dsh-credentials';
import { Remote, RemoteError, remoteErrorOf, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import z from '@deepseek-ai/schemastery';
import { BALANCE_ENDPOINT_PATH, DEFAULT_API_KEY_ENV, DEFAULT_AUTO_REFRESH, DEFAULT_BASE_URL, DEFAULT_CACHE_TTL_MS, DEFAULT_REFRESH_INTERVAL_MS, DEFAULT_TIMEOUT_MS, MAX_PERIOD_MS, NS, } from "./constants.js";
/** Cordis plugin name; also the patch row id in `cordis.patch.yml`. */
export const name = 'deepseek-balance';
/** The settings schema; a `role('credential-ref')` field keeps the key name off secret redaction surfaces. */
export const Config = z.object({
    apiKeyEnv: z.string().role('credential-ref').default(DEFAULT_API_KEY_ENV),
    baseURL: z.string().default(DEFAULT_BASE_URL),
    autoRefresh: z.boolean().default(DEFAULT_AUTO_REFRESH),
    refreshIntervalMs: z.number().step(1).min(1_000).max(MAX_PERIOD_MS).default(DEFAULT_REFRESH_INTERVAL_MS),
    cacheTtlMs: z.number().step(1).min(0).max(MAX_PERIOD_MS).default(DEFAULT_CACHE_TTL_MS),
    timeoutMs: z.number().step(1).min(1_000).max(MAX_PERIOD_MS).default(DEFAULT_TIMEOUT_MS),
});
/** Resolve one config snapshot into validated request facts. */
function resolveConfig(config) {
    const apiKeyEnv = config.apiKeyEnv ?? DEFAULT_API_KEY_ENV;
    return {
        apiKeyEnv,
        baseURL: trimTrailingSlash(config.baseURL ?? DEFAULT_BASE_URL),
        autoRefresh: config.autoRefresh ?? DEFAULT_AUTO_REFRESH,
        refreshIntervalMs: config.refreshIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS,
        cacheTtlMs: config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS,
        timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    };
}
/** Strip one trailing slash so `${baseURL}${BALANCE_ENDPOINT_PATH}` never doubles a separator. */
function trimTrailingSlash(value) {
    return value.length > 1 && value.endsWith('/') ? value.slice(0, -1) : value;
}
/** Coerce one wire field to its decimal string, or `0.00` when absent/malformed. */
function decimalString(value) {
    if (typeof value === 'string' && value.trim().length > 0)
        return value.trim();
    if (typeof value === 'number' && Number.isFinite(value))
        return String(value);
    return '0.00';
}
/** Map the official snake_case body onto the normalized snapshot shape. */
function normalizeBalance(body, fetchedAt) {
    const wire = body;
    const infos = Array.isArray(wire.balance_infos) ? wire.balance_infos : [];
    const currencies = [];
    for (const entry of infos) {
        const info = entry;
        if (typeof info.currency !== 'string' || info.currency.length === 0)
            continue;
        currencies.push({
            currency: info.currency,
            totalBalance: decimalString(info.total_balance),
            grantedBalance: decimalString(info.granted_balance),
            toppedUpBalance: decimalString(info.topped_up_balance),
        });
    }
    return {
        isAvailable: wire.is_available !== false,
        fetchedAt,
        currencies,
    };
}
/**
 * Host service backing the `ctx.remote.deepseekBalance` namespace. Discovered
 * by the Gateway's SRC fallback from the live `@Remote` markers; the three
 * zero-argument methods keep the wire contract free of optional-argument
 * parsing. Snapshot reads ride a short TTL cache with in-flight dedup, so a
 * chatty browser widget never hammers the official API.
 */
let BalanceController = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _getBalance_decorators;
    let _refreshBalance_decorators;
    let _getOptions_decorators;
    return class BalanceController extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _getBalance_decorators = [Remote];
            _refreshBalance_decorators = [Remote];
            _getOptions_decorators = [Remote];
            __esDecorate(this, null, _getBalance_decorators, { kind: "method", name: "getBalance", static: false, private: false, access: { has: obj => "getBalance" in obj, get: obj => obj.getBalance }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _refreshBalance_decorators, { kind: "method", name: "refreshBalance", static: false, private: false, access: { has: obj => "refreshBalance" in obj, get: obj => obj.refreshBalance }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getOptions_decorators, { kind: "method", name: "getOptions", static: false, private: false, access: { has: obj => "getOptions" in obj, get: obj => obj.getOptions }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        current = __runInitializers(this, _instanceExtraInitializers);
        fetchBalance;
        cache;
        inflight;
        /**
         * @param ctx - the plugin's Host context; the service registers as `deepseekBalance`.
         * @param current - live config resolver (settings snapshot source).
         * @param fetchBalance - injectable transport for unit tests; defaults to the global fetch.
         */
        constructor(ctx, current, fetchBalance = globalThis.fetch) {
            super(ctx, 'deepseekBalance');
            this.current = current;
            this.fetchBalance = fetchBalance;
        }
        /** Drop the cached snapshot; the settings `onChange` hook calls this so the next read sees new config. */
        clearCache() {
            this.cache = undefined;
        }
        /**
         * Fetch the current balance snapshot, serving the TTL cache when fresh.
         * @returns the normalized snapshot.
         */
        async getBalance() {
            const config = resolveConfig(this.current());
            const cached = this.cache;
            if (cached !== undefined && config.cacheTtlMs > 0 && Date.now() - cached.at < config.cacheTtlMs) {
                return cached.snapshot;
            }
            return this.fetchOrDedupe(config);
        }
        /**
         * Fetch a fresh balance snapshot, bypassing the cache.
         * @returns the normalized snapshot.
         */
        async refreshBalance() {
            return this.fetchOrDedupe(resolveConfig(this.current()));
        }
        /**
         * Resolve the plugin options and whether a usable key resolves.
         * @returns the resolved options view — never the key itself.
         */
        async getOptions() {
            const config = resolveConfig(this.current());
            return {
                apiKeyEnv: config.apiKeyEnv,
                baseURL: config.baseURL,
                autoRefresh: config.autoRefresh,
                refreshIntervalMs: config.refreshIntervalMs,
                cacheTtlMs: config.cacheTtlMs,
                keyConfigured: (await this.resolveKey(config)) !== undefined,
            };
        }
        /** Share one in-flight fetch across concurrent callers; failures are not cached. */
        fetchOrDedupe(config) {
            if (this.inflight !== undefined)
                return this.inflight;
            const run = this.fetchAndCache(config);
            this.inflight = run;
            const clear = () => {
                if (this.inflight === run)
                    this.inflight = undefined;
            };
            void run.then(clear, clear);
            return run;
        }
        async fetchAndCache(config) {
            const snapshot = await this.fetchSnapshot(config);
            this.cache = { snapshot, at: Date.now() };
            return snapshot;
        }
        async fetchSnapshot(config) {
            const key = await this.resolveKey(config);
            if (key === undefined) {
                throw new RemoteError('deepseek-balance/missing-credential', `deepseek-balance: no API key for "${config.apiKeyEnv}"; store it through the credentials`
                    + ' service (the web Models page writes it) or export it in the launching environment', { ref: config.apiKeyEnv });
            }
            try {
                const response = await this.fetchBalance(`${config.baseURL}${BALANCE_ENDPOINT_PATH}`, {
                    headers: {
                        authorization: `Bearer ${key}`,
                        accept: 'application/json',
                    },
                    signal: AbortSignal.timeout(config.timeoutMs),
                });
                if (!response.ok) {
                    throw new RemoteError('deepseek-balance/api-error', `deepseek-balance: the balance endpoint returned HTTP ${String(response.status)}`, { status: response.status });
                }
                const body = await response.json();
                return normalizeBalance(body, new Date().toISOString());
            }
            catch (error) {
                if (remoteErrorOf(error) !== undefined)
                    throw error;
                throw new RemoteError('deepseek-balance/api-error', `deepseek-balance: balance request failed: ${error instanceof Error ? error.message : String(error)}`, {}, { cause: error });
            }
        }
        /** Resolve the API key for the current config through the credential seam. */
        async resolveKey(config) {
            const credentials = this.ctx.get('credentials');
            if (credentials === undefined)
                return undefined;
            const hit = await credentials.resolve(credentialRef(config.apiKeyEnv));
            return hit !== undefined && hit.value.length > 0 ? hit.value : undefined;
        }
    };
})();
export { BalanceController };
/**
 * Mount the balance controller and the settings section.
 * @param ctx - Host context (the web composition carries the settings and credentials seams).
 * @param config - loader-provided plugin configuration.
 */
export function apply(ctx, config) {
    let current = () => config;
    const controller = new BalanceController(ctx, () => current());
    ctx.inject(['settings'], (settingsCtx) => {
        settingsCtx.settings.installSection(ctx, NS, Config, config, {
            // A live settings snapshot replaces the loader config; the resolver is
            // re-read per Remote call, so an edit reaches the next request.
            setSource: (source) => { current = source; },
            // Config facts changed: the next read must not serve a stale snapshot.
            onChange: () => { controller.clearCache(); },
        });
    });
}
//# sourceMappingURL=index.js.map