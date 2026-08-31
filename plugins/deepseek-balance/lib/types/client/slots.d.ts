/**
 * Slot face contracts for the balance widget (sidebar footer action) and the
 * balance settings card (plugin configuration tab).
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/slots
 */
import type { StateStore, BalanceWidgetState } from './controller.ts';
import type { BalanceSettingsView } from './settings-controller.ts';
/** Inject face of the sidebar footer-action balance widget. */
export interface BalanceWidgetFace {
    hooks: {
        /** Widget snapshot store (status, snapshot, options, lastUpdated). */
        balance: StateStore<BalanceWidgetState>;
    };
    /** Manually refresh; bypasses the host cache. */
    onRefresh: () => void;
    /** Persist the auto-refresh switch state. */
    onToggleAutoRefresh: (enabled: boolean) => void;
    /** Persist the auto-refresh interval. */
    onSetIntervalMs: (ms: number) => void;
}
/** Inject face of the settings card for the `deepseek-balance` namespace. */
export interface BalanceSettingsCardFace {
    hooks: {
        /** Resolved settings-section view (value + user overrides). */
        settings: StateStore<BalanceSettingsView>;
        /** Shared widget snapshot store for the live preview. */
        balance: StateStore<BalanceWidgetState>;
    };
    /** Manually refresh the preview; bypasses the host cache. */
    onRefresh: () => void;
    /** Write one settings field through the revision-fenced scope. */
    onSetField: (field: string, value: unknown) => void;
    /** Clear one field back to the composition layer. */
    onUnsetField: (field: string) => void;
}
//# sourceMappingURL=slots.d.ts.map