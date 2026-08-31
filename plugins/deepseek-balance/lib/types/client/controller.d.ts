/**
 * Balance widget state controller: owns the observable snapshot both browser
 * surfaces (the sidebar footer action and the settings card) render, drives
 * the auto-refresh timer, and writes the widget's inline toggles back through
 * the `deepseek-balance` settings scope. All reads ride the Host Remote
 * namespace; no secret ever reaches this process.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/controller
 */
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client';
import type { BalanceOptionsView, BalanceSnapshot } from '../types.ts';
import type { DeepseekBalanceRemote } from './remote-types.ts';
/** One renderable widget state; replaced atomically (stable reference per change). */
export interface BalanceWidgetState {
    /** Overall surface state. */
    status: 'idle' | 'loading' | 'ready' | 'error';
    /** Latest balance snapshot; absent until the first successful read. */
    snapshot: BalanceSnapshot | undefined;
    /** Latest resolved options; absent until the first read. */
    options: BalanceOptionsView | undefined;
    /** Failure message from the last failed read. */
    error: string | undefined;
    /** Epoch ms of the last successful snapshot. */
    lastUpdated: number | undefined;
    /** Whether a read is currently crossing the wire. */
    refreshing: boolean;
}
/** Minimal observable snapshot store (getSnapshot/subscribe pair, stable identity). */
export declare class StateStore<T> {
    private value;
    private readonly listeners;
    constructor(initial: T);
    /**
     * Read the current snapshot value.
     * @returns the current value (stable reference until the next `set`).
     */
    getSnapshot(): T;
    /**
     * Observe snapshot replacements.
     * @param listener - invoked after each replacement.
     * @returns the disposer removing this listener.
     */
    subscribe(listener: () => void): () => void;
    /**
     * Replace the snapshot and notify listeners.
     * @param value - the new value.
     */
    set(value: T): void;
}
/** Fields the widget itself may write back through the settings scope. */
export type WidgetField = 'autoRefresh' | 'refreshIntervalMs';
/**
 * Owns the balance snapshot lifecycle. Construct with the resolved Remote
 * namespace and the bound `deepseek-balance` settings scope, then `start()`
 * from the owning plugin fiber; `dispose()` clears the timer and subscription.
 */
export declare class BalanceWidgetController {
    private readonly remote;
    private readonly scope;
    private readonly store;
    private readonly unsub;
    private timer;
    private pending;
    private disposed;
    /**
     * @param remote - the mounted `deepseekBalance` Remote namespace.
     * @param scope - the `deepseek-balance` settings scope (writes the widget's toggles).
     */
    constructor(remote: DeepseekBalanceRemote, scope: SettingsScope<Record<string, unknown>>);
    /**
     * The observable store consumers bind as their `hooks.balance`.
     * @returns the snapshot store.
     */
    get hooks(): StateStore<BalanceWidgetState>;
    /** Load options + snapshot once and schedule the auto-refresh timer. */
    start(): void;
    /**
     * Manually trigger a read pipeline.
     * @param force - whether to bypass the host snapshot cache.
     */
    refresh(force: boolean): void;
    /**
     * Persist one widget-owned setting field and re-derive the schedule.
     * @param field - the settings field to write.
     * @param value - the new field value.
     */
    setField(field: WidgetField, value: boolean | number): void;
    /** React to a Host connection reset: drop stale facts and re-read. */
    reset(): void;
    /** Clear the timer, stop the subscription, and wait for the in-flight read. */
    dispose(): void;
    /** Serialized read pipeline shared by every trigger; failures land in state. */
    private load;
    private runLoad;
    private persist;
    private onScopeChange;
    /** (Re)arm the auto-refresh timer from the current options; a running read reschedules itself on settle. */
    private reschedule;
    private update;
}
//# sourceMappingURL=controller.d.ts.map