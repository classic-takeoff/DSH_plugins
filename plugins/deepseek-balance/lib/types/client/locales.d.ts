/**
 * DeepSeek balance UI dictionaries.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/locales
 */
/** Settings namespace and locale namespace for both browser surfaces. */
export declare const NS = "deepseek-balance";
/** Dictionary keys for the balance surfaces. */
export type DeepseekBalanceKey = 'trigger.label' | 'trigger.aria' | 'panel.title' | 'panel.loading' | 'panel.readFailed' | 'panel.retry' | 'panel.lastUpdated' | 'panel.never' | 'panel.refresh' | 'panel.autoRefresh' | 'panel.interval' | 'panel.interval.short' | 'panel.interval.medium' | 'panel.interval.long' | 'panel.interval.off' | 'panel.keyMissing' | 'panel.gotoSettings' | 'availability.available' | 'availability.insufficient' | 'availability.unknown' | 'currency.total' | 'currency.granted' | 'currency.toppedUp' | 'settings.title' | 'settings.description' | 'settings.overridden' | 'settings.apiKeyEnv' | 'settings.apiKeyEnvHint' | 'settings.baseURL' | 'settings.autoRefresh' | 'settings.refreshInterval' | 'settings.cacheTtl' | 'settings.timeout' | 'settings.keyStatus' | 'settings.keyConfigured' | 'settings.keyNotConfigured' | 'settings.saved' | 'settings.restore' | 'settings.preview' | 'settings.previewEmpty';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'deepseek-balance': DeepseekBalanceKey;
    }
}
/** English balance UI copy. */
export declare const en: Record<DeepseekBalanceKey, string>;
/** Simplified Chinese balance UI copy. */
export declare const zh: Record<DeepseekBalanceKey, string>;
//# sourceMappingURL=locales.d.ts.map