/**
 * Settings-card controller: projects the `deepseek-balance` settings scope
 * onto a renderable view (resolved value plus which fields the user document
 * overrides) and forwards field writes through the revision-fenced scope.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/settings-controller
 */

import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import { StateStore } from './controller.ts'

/** One renderable settings view; replaced atomically on scope changes. */
export interface BalanceSettingsView {
  /** Scope mirror status; `unavailable` when the Host serves no section. */
  status: 'loading' | 'ready' | 'unavailable'
  /** Resolved section value (schema-validated, composition defaults applied). */
  value: Record<string, unknown> | undefined
  /** Raw user-document layer; key presence marks an overridden field. */
  user: unknown
  /** Whether the Host allows writes. */
  writable: boolean
}

/** Bridges one settings scope onto the card's observable view and writes. */
export class BalanceSettingsController {
  private readonly store: StateStore<BalanceSettingsView>
  private readonly unsub: () => void

  /** @param scope - the bound `deepseek-balance` settings scope. */
  constructor(private readonly scope: SettingsScope<Record<string, unknown>>) {
    this.store = new StateStore<BalanceSettingsView>({ status: 'loading', value: undefined, user: undefined, writable: false })
    this.unsub = this.scope.subscribe(() => { this.derive() })
    this.derive()
  }

  /**
   * The observable settings view.
   * @returns the snapshot store.
   */
  get hooks(): StateStore<BalanceSettingsView> {
    return this.store
  }

  /**
   * Write one field; the scope queues, revision-fences, and folds the write.
   * @param field - settings field to write.
   * @param value - JSON-shaped value selected by the user.
   */
  setField(field: string, value: unknown): void {
    void this.scope.set(field, value)
  }

  /**
   * Clear one field back to the composition layer.
   * @param field - settings field to clear.
   */
  unsetField(field: string): void {
    void this.scope.unset(field)
  }

  /** Stop mirror subscription. */
  dispose(): void {
    this.unsub()
  }

  private derive(): void {
    const snapshot = this.scope.getSnapshot()
    this.store.set({
      status: snapshot.status,
      value: snapshot.value,
      user: snapshot.user,
      writable: snapshot.writable,
    })
  }
}
