/**
 * Settings-card controller: projects the `deepseek-balance` settings scope
 * onto a renderable view (resolved value plus which fields the user document
 * overrides) and forwards field writes through the revision-fenced scope.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/settings-controller
 */
import { StateStore } from "./controller.js";
/** Bridges one settings scope onto the card's observable view and writes. */
export class BalanceSettingsController {
    scope;
    store;
    unsub;
    /** @param scope - the bound `deepseek-balance` settings scope. */
    constructor(scope) {
        this.scope = scope;
        this.store = new StateStore({ status: 'loading', value: undefined, user: undefined, writable: false });
        this.unsub = this.scope.subscribe(() => { this.derive(); });
        this.derive();
    }
    /**
     * The observable settings view.
     * @returns the snapshot store.
     */
    get hooks() {
        return this.store;
    }
    /**
     * Write one field; the scope queues, revision-fences, and folds the write.
     * @param field - settings field to write.
     * @param value - JSON-shaped value selected by the user.
     */
    setField(field, value) {
        void this.scope.set(field, value);
    }
    /**
     * Clear one field back to the composition layer.
     * @param field - settings field to clear.
     */
    unsetField(field) {
        void this.scope.unset(field);
    }
    /** Stop mirror subscription. */
    dispose() {
        this.unsub();
    }
    derive() {
        const snapshot = this.scope.getSnapshot();
        this.store.set({
            status: snapshot.status,
            value: snapshot.value,
            user: snapshot.user,
            writable: snapshot.writable,
        });
    }
}
//# sourceMappingURL=settings-controller.js.map