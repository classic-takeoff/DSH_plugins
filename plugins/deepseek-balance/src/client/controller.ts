/**
 * Balance widget state controller: owns the observable snapshot both browser
 * surfaces (the sidebar footer action and the settings card) render, drives
 * the auto-refresh timer, and writes the widget's inline toggles back through
 * the `deepseek-balance` settings scope. All reads ride the Host Remote
 * namespace; no secret ever reaches this process.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/controller
 */

import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { BalanceOptionsView, BalanceSnapshot } from '../types.ts'
import type { DeepseekBalanceRemote } from './remote-types.ts'

/** One renderable widget state; replaced atomically (stable reference per change). */
export interface BalanceWidgetState {
  /** Overall surface state. */
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** Latest balance snapshot; absent until the first successful read. */
  snapshot: BalanceSnapshot | undefined
  /** Latest resolved options; absent until the first read. */
  options: BalanceOptionsView | undefined
  /** Failure message from the last failed read. */
  error: string | undefined
  /** Epoch ms of the last successful snapshot. */
  lastUpdated: number | undefined
  /** Whether a read is currently crossing the wire. */
  refreshing: boolean
}

const INITIAL_STATE: BalanceWidgetState = {
  status: 'idle',
  snapshot: undefined,
  options: undefined,
  error: undefined,
  lastUpdated: undefined,
  refreshing: false,
}

/** Minimal observable snapshot store (getSnapshot/subscribe pair, stable identity). */
export class StateStore<T> {
  private value: T
  private readonly listeners = new Set<() => void>()

  constructor(initial: T) {
    this.value = initial
  }

  /**
   * Read the current snapshot value.
   * @returns the current value (stable reference until the next `set`).
   */
  getSnapshot(): T {
    return this.value
  }

  /**
   * Observe snapshot replacements.
   * @param listener - invoked after each replacement.
   * @returns the disposer removing this listener.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /**
   * Replace the snapshot and notify listeners.
   * @param value - the new value.
   */
  set(value: T): void {
    if (this.value === value) return
    this.value = value
    for (const listener of [...this.listeners]) listener()
  }
}

/** Fields the widget itself may write back through the settings scope. */
export type WidgetField = 'autoRefresh' | 'refreshIntervalMs'

/**
 * Owns the balance snapshot lifecycle. Construct with the resolved Remote
 * namespace and the bound `deepseek-balance` settings scope, then `start()`
 * from the owning plugin fiber; `dispose()` clears the timer and subscription.
 */
export class BalanceWidgetController {
  private readonly store: StateStore<BalanceWidgetState>
  private readonly unsub: () => void
  private timer: ReturnType<typeof setTimeout> | undefined
  private pending: Promise<void> | undefined
  private disposed = false

  /**
   * @param remote - the mounted `deepseekBalance` Remote namespace.
   * @param scope - the `deepseek-balance` settings scope (writes the widget's toggles).
   */
  constructor(
    private readonly remote: DeepseekBalanceRemote,
    private readonly scope: SettingsScope<Record<string, unknown>>,
  ) {
    this.store = new StateStore<BalanceWidgetState>({ ...INITIAL_STATE })
    this.unsub = this.scope.subscribe(() => { this.onScopeChange() })
  }

  /**
   * The observable store consumers bind as their `hooks.balance`.
   * @returns the snapshot store.
   */
  get hooks(): StateStore<BalanceWidgetState> {
    return this.store
  }

  /** Load options + snapshot once and schedule the auto-refresh timer. */
  start(): void {
    void this.load(false)
  }

  /**
   * Manually trigger a read pipeline.
   * @param force - whether to bypass the host snapshot cache.
   */
  refresh(force: boolean): void {
    void this.load(force)
  }

  /**
   * Persist one widget-owned setting field and re-derive the schedule.
   * @param field - the settings field to write.
   * @param value - the new field value.
   */
  setField(field: WidgetField, value: boolean | number): void {
    void this.persist(field, value)
  }

  /** React to a Host connection reset: drop stale facts and re-read. */
  reset(): void {
    this.update({ status: 'idle', error: undefined })
    this.reschedule()
    void this.load(false)
  }

  /** Clear the timer, stop the subscription, and wait for the in-flight read. */
  dispose(): void {
    this.disposed = true
    if (this.timer !== undefined) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    this.unsub()
  }

  /** Serialized read pipeline shared by every trigger; failures land in state. */
  private load(force: boolean): Promise<void> {
    if (this.pending !== undefined) return this.pending
    const run = this.runLoad(force)
    this.pending = run
    const clear = (): void => {
      if (this.pending === run) this.pending = undefined
    }
    void run.then(clear, clear)
    return run
  }

  private async runLoad(force: boolean): Promise<void> {
    if (this.disposed) return
    this.update({ refreshing: true })
    if (this.store.getSnapshot().snapshot === undefined) this.update({ status: 'loading' })

    const options = await this.remote.getOptions()
    if (options.ok) this.update({ options: options.value })

    const snapshot = force ? await this.remote.refreshBalance() : await this.remote.getBalance()
    if (snapshot.ok) {
      this.update({
        status: 'ready',
        snapshot: snapshot.value,
        lastUpdated: Date.now(),
        error: undefined,
        refreshing: false,
      })
    } else if (this.store.getSnapshot().snapshot !== undefined) {
      // Keep rendering the last good snapshot; surface the failure in the footer.
      this.update({ error: snapshot.error.message, refreshing: false })
    } else {
      this.update({ status: 'error', error: snapshot.error.message, refreshing: false })
    }
    this.reschedule()
  }

  private async persist(field: WidgetField, value: boolean | number): Promise<void> {
    try {
      await this.scope.set(field, value)
      // The settings mirror folds the committed write; refresh the options
      // truth (host-side defaults, credential availability) without a balance read.
      const options = await this.remote.getOptions()
      if (options.ok) this.update({ options: options.value })
    } catch (error) {
      this.update({ error: error instanceof Error ? error.message : String(error) })
    } finally {
      this.reschedule()
    }
  }

  private onScopeChange(): void {
    // A settings edit elsewhere (the card) changes the schedule inputs.
    this.reschedule()
  }

  /** (Re)arm the auto-refresh timer from the current options; a running read reschedules itself on settle. */
  private reschedule(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    if (this.disposed) return
    const options = this.store.getSnapshot().options
    if (options === undefined || !options.autoRefresh) return
    const ms = Math.max(1_000, options.refreshIntervalMs)
    this.timer = setTimeout(() => {
      this.timer = undefined
      void this.load(true)
    }, ms)
  }

  private update(patch: Partial<BalanceWidgetState>): void {
    this.store.set({ ...this.store.getSnapshot(), ...patch })
  }
}
