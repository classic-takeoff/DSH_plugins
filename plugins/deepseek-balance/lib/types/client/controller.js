/**
 * Balance widget state controller: owns the observable snapshot both browser
 * surfaces (the sidebar footer action and the settings card) render, drives
 * the auto-refresh timer, and writes the widget's inline toggles back through
 * the `deepseek-balance` settings scope. All reads ride the Host Remote
 * namespace; no secret ever reaches this process.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/controller
 */
const INITIAL_STATE = {
    status: 'idle',
    snapshot: undefined,
    options: undefined,
    error: undefined,
    lastUpdated: undefined,
    refreshing: false,
};
/** Minimal observable snapshot store (getSnapshot/subscribe pair, stable identity). */
export class StateStore {
    value;
    listeners = new Set();
    constructor(initial) {
        this.value = initial;
    }
    /**
     * Read the current snapshot value.
     * @returns the current value (stable reference until the next `set`).
     */
    getSnapshot() {
        return this.value;
    }
    /**
     * Observe snapshot replacements.
     * @param listener - invoked after each replacement.
     * @returns the disposer removing this listener.
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }
    /**
     * Replace the snapshot and notify listeners.
     * @param value - the new value.
     */
    set(value) {
        if (this.value === value)
            return;
        this.value = value;
        for (const listener of [...this.listeners])
            listener();
    }
}
/**
 * Owns the balance snapshot lifecycle. Construct with the resolved Remote
 * namespace and the bound `deepseek-balance` settings scope, then `start()`
 * from the owning plugin fiber; `dispose()` clears the timer and subscription.
 */
export class BalanceWidgetController {
    remote;
    scope;
    store;
    unsub;
    timer;
    pending;
    disposed = false;
    /**
     * @param remote - the mounted `deepseekBalance` Remote namespace.
     * @param scope - the `deepseek-balance` settings scope (writes the widget's toggles).
     */
    constructor(remote, scope) {
        this.remote = remote;
        this.scope = scope;
        this.store = new StateStore({ ...INITIAL_STATE });
        this.unsub = this.scope.subscribe(() => { this.onScopeChange(); });
    }
    /**
     * The observable store consumers bind as their `hooks.balance`.
     * @returns the snapshot store.
     */
    get hooks() {
        return this.store;
    }
    /** Load options + snapshot once and schedule the auto-refresh timer. */
    start() {
        void this.load(false);
    }
    /**
     * Manually trigger a read pipeline.
     * @param force - whether to bypass the host snapshot cache.
     */
    refresh(force) {
        void this.load(force);
    }
    /**
     * Persist one widget-owned setting field and re-derive the schedule.
     * @param field - the settings field to write.
     * @param value - the new field value.
     */
    setField(field, value) {
        void this.persist(field, value);
    }
    /** React to a Host connection reset: drop stale facts and re-read. */
    reset() {
        this.update({ status: 'idle', error: undefined });
        this.reschedule();
        void this.load(false);
    }
    /** Clear the timer, stop the subscription, and wait for the in-flight read. */
    dispose() {
        this.disposed = true;
        if (this.timer !== undefined) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
        this.unsub();
    }
    /** Serialized read pipeline shared by every trigger; failures land in state. */
    load(force) {
        if (this.pending !== undefined)
            return this.pending;
        const run = this.runLoad(force);
        this.pending = run;
        const clear = () => {
            if (this.pending === run)
                this.pending = undefined;
        };
        void run.then(clear, clear);
        return run;
    }
    async runLoad(force) {
        if (this.disposed)
            return;
        this.update({ refreshing: true });
        if (this.store.getSnapshot().snapshot === undefined)
            this.update({ status: 'loading' });
        const options = await this.remote.getOptions();
        if (options.ok)
            this.update({ options: options.value });
        const snapshot = force ? await this.remote.refreshBalance() : await this.remote.getBalance();
        if (snapshot.ok) {
            this.update({
                status: 'ready',
                snapshot: snapshot.value,
                lastUpdated: Date.now(),
                error: undefined,
                refreshing: false,
            });
        }
        else if (this.store.getSnapshot().snapshot !== undefined) {
            // Keep rendering the last good snapshot; surface the failure in the footer.
            this.update({ error: snapshot.error.message, refreshing: false });
        }
        else {
            this.update({ status: 'error', error: snapshot.error.message, refreshing: false });
        }
        this.reschedule();
    }
    async persist(field, value) {
        try {
            await this.scope.set(field, value);
            // The settings mirror folds the committed write; refresh the options
            // truth (host-side defaults, credential availability) without a balance read.
            const options = await this.remote.getOptions();
            if (options.ok)
                this.update({ options: options.value });
        }
        catch (error) {
            this.update({ error: error instanceof Error ? error.message : String(error) });
        }
        finally {
            this.reschedule();
        }
    }
    onScopeChange() {
        // A settings edit elsewhere (the card) changes the schedule inputs.
        this.reschedule();
    }
    /** (Re)arm the auto-refresh timer from the current options; a running read reschedules itself on settle. */
    reschedule() {
        if (this.timer !== undefined) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
        if (this.disposed)
            return;
        const options = this.store.getSnapshot().options;
        if (options === undefined || !options.autoRefresh)
            return;
        const ms = Math.max(1_000, options.refreshIntervalMs);
        this.timer = setTimeout(() => {
            this.timer = undefined;
            void this.load(true);
        }, ms);
    }
    update(patch) {
        this.store.set({ ...this.store.getSnapshot(), ...patch });
    }
}
//# sourceMappingURL=controller.js.map