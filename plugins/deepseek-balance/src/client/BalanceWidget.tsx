/**
 * Sidebar footer-action balance widget: a compact badge showing the primary
 * currency total with an availability dot, a one-tap refresh, and a popover
 * panel with per-currency breakdowns, last-updated time, and the auto-refresh
 * toggle + interval. Mirrors the `sidebar.footer.action` shell geometry used
 * by ui-cordis: a 42px layer in wide mode, a 36px circular seat in the rail.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/BalanceWidget
 */

import { useLayoutEffect, useRef, useState } from 'react'
import {
  IconApiOutline14,
  IconClockOutline16,
  IconLoadingOutline16,
  IconRefreshOutline16,
  IconWarningOutline16,
  StateDot,
  useDismissOnOutsidePointer,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { BalanceWidgetState } from './controller.ts'
import { formatAmount, proportionOf } from './format.ts'
import type { DeepseekBalanceKey } from './locales.ts'
import type { BalanceWidgetFace } from './slots.ts'
import css from './BalanceWidget.module.css'

/** Full component props composed by the sidebar footer-action slot. */
export type BalanceWidgetProps =
  PropsRuntime<'sidebar.footer.action'> & InjectFace<BalanceWidgetFace> & PropsLocale<'deepseek-balance'>

/** Auto-refresh interval choices offered by the panel, in milliseconds. */
export const INTERVAL_OPTIONS: readonly number[] = [30_000, 60_000, 600_000]

const INTERVAL_KEYS: Record<number, DeepseekBalanceKey> = {
  30_000: 'panel.interval.short',
  60_000: 'panel.interval.medium',
  600_000: 'panel.interval.long',
}

type DotState = 'done' | 'warning' | 'ongoing' | 'error'

/** Availability dot state for one widget snapshot. */
function dotStateOf(state: BalanceWidgetState): DotState {
  if (state.status === 'error') return 'error'
  if (state.snapshot === undefined) return 'ongoing'
  return state.snapshot.isAvailable ? 'done' : 'warning'
}

/** Availability pill label key for one snapshot. */
function availabilityKey(state: BalanceWidgetState): DeepseekBalanceKey {
  if (state.snapshot === undefined) return 'availability.unknown'
  return state.snapshot.isAvailable ? 'availability.available' : 'availability.insufficient'
}

/** Pill tone matching the availability key. */
function availabilityTone(state: BalanceWidgetState): 'available' | 'insufficient' | 'unknown' {
  const key = availabilityKey(state)
  if (key === 'availability.available') return 'available'
  if (key === 'availability.insufficient') return 'insufficient'
  return 'unknown'
}

/** Primary (first reported) currency total, when any exists. */
function primaryAmount(state: BalanceWidgetState): string | undefined {
  const first = state.snapshot?.currencies[0]
  return first === undefined ? undefined : formatAmount(first.totalBalance, first.currency)
}

/** Compact "updated" label: the locale's clock time of the last successful read. */
function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * Render the sidebar-foot balance action.
 * @param props - runtime `wide` seat, bound widget hooks, actions, and the `t` locale seat.
 */
export function BalanceWidget({
  wide,
  useBalance,
  onRefresh,
  onToggleAutoRefresh,
  onSetIntervalMs,
  t,
}: BalanceWidgetProps) {
  const state = useBalance(snapshot => snapshot)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<{ left: number; bottom: number }>()
  useDismissOnOutsidePointer(rootRef, open, setOpen)

  // The panel is position: fixed (the sidebar clips overflow), so it hugs the
  // trigger through a measured offset instead of document flow.
  useLayoutEffect(() => {
    if (!open) return
    const place = (): void => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (rect !== undefined) {
        setAnchor({ left: rect.left, bottom: window.innerHeight - rect.top + 8 })
      }
    }
    place()
    window.addEventListener('resize', place)
    return () => { window.removeEventListener('resize', place) }
  }, [open])

  const amount = primaryAmount(state)
  const interval = state.options?.refreshIntervalMs ?? 600_000
  const autoRefresh = state.options?.autoRefresh ?? true

  return (
    <div className={wide ? css.layer : `${css.layer} ${css.rail}`} ref={rootRef}>
      {wide
        ? (
          <div className={css.footerButtons}>
            <button
              type="button"
              className={css.badge}
              data-active={open || undefined}
              aria-label={t('trigger.aria')}
              aria-expanded={open}
              onClick={() => { setOpen(!open) }}
            >
              <span className={css.badgeIcon}>
                <IconApiOutline14 size={14} />
              </span>
              <span className={css.badgeLabel}>{t('trigger.label')}</span>
              <span className={css.badgeAmount}>{amount ?? '—'}</span>
              <span className={css.badgeDot}>
                <StateDot state={dotStateOf(state)} />
              </span>
            </button>
            <button
              type="button"
              className={css.refresh}
              aria-label={t('panel.refresh')}
              title={t('panel.refresh')}
              onClick={() => { onRefresh() }}
            >
              {state.refreshing
                ? <IconLoadingOutline16 size={14} className={css.spin} />
                : <IconRefreshOutline16 size={14} />}
            </button>
          </div>
        )
        : (
          <button
            type="button"
            className={css.badge}
            data-active={open || undefined}
            aria-label={t('trigger.aria')}
            aria-expanded={open}
            onClick={() => { setOpen(!open) }}
          >
            <span className={css.badgeIcon}>
              <IconApiOutline14 size={14} />
            </span>
            <span className={css.railDot}>
              <StateDot state={dotStateOf(state)} />
            </span>
          </button>
        )}

      {open && anchor !== undefined && (
        <div className={css.panel} style={{ left: anchor.left, bottom: anchor.bottom }}>
          <header className={css.panelHeader}>
            <span className={css.panelTitle}>{t('panel.title')}</span>
            <span
              className={css.pill}
              data-tone={availabilityTone(state)}
            >
              {t(availabilityKey(state))}
            </span>
          </header>

          <div className={css.panelBody}>
            {state.status === 'loading' && (
              <div className={css.centerRow}>
                <IconLoadingOutline16 size={16} className={css.spin} />
                <span>{t('panel.loading')}</span>
              </div>
            )}

            {state.status === 'error' && (
              <div className={css.errorBox} role="alert">
                <IconWarningOutline16 size={14} />
                <span>{t('panel.readFailed', { message: state.error ?? '' })}</span>
                <button type="button" className={css.textButton} onClick={() => { onRefresh() }}>
                  {t('panel.retry')}
                </button>
              </div>
            )}

            {state.status === 'ready' && state.snapshot !== undefined && (
              <div className={css.currencyList}>
                {state.snapshot.currencies.length === 0 && (
                  <div className={css.centerRow}>{t('panel.keyMissing')}</div>
                )}
                {state.snapshot.currencies.map(entry => (
                  <div key={entry.currency} className={css.currencyBlock}>
                    <div className={css.currencyHeader}>
                      <span className={css.currencyName}>{entry.currency}</span>
                      <span className={css.currencyTotal}>{formatAmount(entry.totalBalance, entry.currency)}</span>
                    </div>
                    <div className={css.bar} aria-hidden="true">
                      <div
                        className={css.barGranted}
                        style={{ width: `${proportionOf(entry.grantedBalance, entry.totalBalance) * 100}%` }}
                      />
                      <div
                        className={css.barToppedUp}
                        style={{ width: `${proportionOf(entry.toppedUpBalance, entry.totalBalance) * 100}%` }}
                      />
                    </div>
                    <div className={css.currencySub}>
                      <span>
                        {t('currency.granted')}
                        <strong>{formatAmount(entry.grantedBalance, entry.currency)}</strong>
                      </span>
                      <span>
                        {t('currency.toppedUp')}
                        <strong>{formatAmount(entry.toppedUpBalance, entry.currency)}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <footer className={css.panelFooter}>
            <div className={css.metaRow}>
              <IconClockOutline16 size={12} />
              <span>
                {state.lastUpdated === undefined
                  ? `${t('panel.lastUpdated')} ${t('panel.never')}`
                  : `${t('panel.lastUpdated')} ${timeLabel(state.lastUpdated)}`}
              </span>
              <button
                type="button"
                className={css.textButton}
                onClick={() => { onRefresh() }}
              >
                {state.refreshing ? t('panel.loading') : t('panel.refresh')}
              </button>
            </div>
            <div className={css.autoRow}>
              <button
                type="button"
                role="switch"
                aria-checked={autoRefresh}
                className={autoRefresh ? `${css.switch} ${css.switchOn}` : css.switch}
                onClick={() => { onToggleAutoRefresh(!autoRefresh) }}
              >
                <span className={css.switchKnob} />
              </button>
              <span className={css.autoLabel}>{t('panel.autoRefresh')}</span>
              <select
                className={css.intervalSelect}
                value={interval}
                disabled={!autoRefresh}
                aria-label={t('panel.interval')}
                onChange={(event) => { onSetIntervalMs(Number(event.target.value)) }}
              >
                {INTERVAL_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {t(INTERVAL_KEYS[option] ?? 'panel.interval.medium')}
                  </option>
                ))}
              </select>
            </div>
          </footer>
        </div>
      )}
    </div>
  )
}
