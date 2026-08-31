/**
 * Settings card for the `deepseek-balance` namespace: the fields the widget
 * behavior depends on (key reference, endpoint, auto-refresh, periods), the
 * credential status, and a live balance preview. Fields write immediately
 * through the revision-fenced settings scope; the user-document layer marks
 * overridden fields with a chip and a restore action.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/BalanceSettingsCard
 */

import { useState } from 'react'
import {
  IconApiOutline14,
  IconCheckOutline16,
  IconLoadingOutline16,
  IconRefreshOutline16,
  StateDot,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import type { BalanceWidgetState } from './controller.ts'
import { formatAmount } from './format.ts'
import type { DeepseekBalanceKey } from './locales.ts'
import type { BalanceSettingsCardFace } from './slots.ts'
import css from './BalanceSettingsCard.module.css'

/** Full component props composed by the plugin-configuration tab. */
export type BalanceSettingsCardProps = InjectFace<BalanceSettingsCardFace> & PropsLocale<'deepseek-balance'>

/** Composition defaults mirrored from the Host schema, for display fallback. */
const FIELD_DEFAULTS: Readonly<Record<string, string | number | boolean>> = {
  apiKeyEnv: 'DEEPSEEK_API_KEY',
  baseURL: 'https://api.deepseek.com',
  autoRefresh: true,
  refreshIntervalMs: 600_000,
  cacheTtlMs: 30_000,
  timeoutMs: 10_000,
}

const TEXT_FIELDS = ['apiKeyEnv', 'baseURL'] as const
const NUMBER_FIELDS = ['refreshIntervalMs', 'cacheTtlMs', 'timeoutMs'] as const

/** Availability tone for the preview row. */
function previewDot(state: BalanceWidgetState): 'done' | 'warning' | 'ongoing' | 'error' {
  if (state.status === 'error') return 'error'
  if (state.snapshot === undefined) return 'ongoing'
  return state.snapshot.isAvailable ? 'done' : 'warning'
}

/**
 * Render the balance plugin card.
 * @param props - bound settings/balance hooks, field actions, and the `t` locale seat.
 */
export function BalanceSettingsCard({
  useSettings,
  useBalance,
  onRefresh,
  onSetField,
  onUnsetField,
  t,
}: BalanceSettingsCardProps) {
  const settings = useSettings(snapshot => snapshot)
  const balance = useBalance(snapshot => snapshot)
  const editable = settings.status === 'ready' && settings.writable
  const user = (settings.user ?? {}) as Record<string, unknown>
  const value = settings.value ?? {}

  const fieldValue = (field: string): string | number | boolean =>
    (value[field] as string | number | boolean | undefined) ?? FIELD_DEFAULTS[field] ?? ''

  const isOverridden = (field: string): boolean => Object.hasOwn(user, field)

  const first = balance.snapshot?.currencies[0]
  const previewAmount = first === undefined
    ? '—'
    : formatAmount(first.totalBalance, first.currency)

  return (
    <div className={css.card}>
      <header className={css.cardHeader}>
        <span className={css.cardIcon}>
          <IconApiOutline14 size={14} />
        </span>
        <div className={css.cardHeading}>
          <h3 className={css.cardTitle}>{t('settings.title')}</h3>
          <p className={css.cardDesc}>{t('settings.description')}</p>
        </div>
      </header>

      <div className={css.fieldList}>
        {TEXT_FIELDS.map(field => (
          <TextField
            key={field}
            field={field}
            label={t(field === 'apiKeyEnv' ? 'settings.apiKeyEnv' : 'settings.baseURL')}
            hint={field === 'apiKeyEnv' ? t('settings.apiKeyEnvHint') : undefined}
            value={String(fieldValue(field))}
            overridden={isOverridden(field)}
            editable={editable}
            onCommit={(next) => { onSetField(field, next) }}
            onRestore={() => { onUnsetField(field) }}
            t={t}
          />
        ))}

        <div className={css.fieldRow}>
          <span className={css.fieldLabel}>{t('settings.autoRefresh')}</span>
          <button
            type="button"
            role="switch"
            aria-checked={fieldValue('autoRefresh') === true}
            disabled={!editable}
            className={fieldValue('autoRefresh') === true ? `${css.switch} ${css.switchOn}` : css.switch}
            onClick={() => { onSetField('autoRefresh', !(fieldValue('autoRefresh') === true)) }}
          >
            <span className={css.switchKnob} />
          </button>
          <span className={css.fieldLabel}>{t('settings.keyStatus')}</span>
          <span
            className={css.keyPill}
            data-state={balance.options?.keyConfigured === true ? 'ok' : 'missing'}
          >
            {balance.options?.keyConfigured === true
              ? t('settings.keyConfigured')
              : t('settings.keyNotConfigured')}
          </span>
        </div>

        <div className={css.numberGrid}>
          {NUMBER_FIELDS.map(field => (
            <NumberField
              key={field}
              field={field}
              label={t(
                field === 'refreshIntervalMs'
                  ? 'settings.refreshInterval'
                  : field === 'cacheTtlMs'
                    ? 'settings.cacheTtl'
                    : 'settings.timeout',
              )}
              value={Number(fieldValue(field))}
              overridden={isOverridden(field)}
              editable={editable}
              onCommit={(next) => { onSetField(field, next) }}
              onRestore={() => { onUnsetField(field) }}
              t={t}
            />
          ))}
        </div>
      </div>

      <footer className={css.preview}>
        <span className={css.previewLabel}>{t('settings.preview')}</span>
        <span className={css.previewDot}>
          <StateDot state={previewDot(balance)} />
        </span>
        <span className={css.previewAmount}>{previewAmount}</span>
        <button
          type="button"
          className={css.previewRefresh}
          aria-label={t('panel.refresh')}
          title={t('panel.refresh')}
          onClick={() => { onRefresh() }}
        >
          {balance.refreshing
            ? <IconLoadingOutline16 size={14} className={css.spin} />
            : <IconRefreshOutline16 size={14} />}
        </button>
      </footer>
    </div>
  )
}

/** One text field: local draft, commit on blur/Enter, override chip + restore. */
function TextField({ field, label, hint, value, overridden, editable, onCommit, onRestore, t }: {
  field: string
  label: string
  hint: string | undefined
  value: string
  overridden: boolean
  editable: boolean
  onCommit: (next: string) => void
  onRestore: () => void
  t: (key: DeepseekBalanceKey) => string
}) {
  const [draft, setDraft] = useState<string | undefined>(undefined)
  const shown = draft ?? value
  const commit = (): void => {
    if (draft !== undefined) {
      onCommit(draft)
      setDraft(undefined)
    }
  }
  return (
    <div className={css.field}>
      <div className={css.fieldHead}>
        <label className={css.fieldLabel} htmlFor={`deepseek-balance-${field}`}>{label}</label>
        {overridden && (
          <button type="button" className={css.overlay} onClick={() => { onRestore() }} title={t('settings.restore')}>
            <IconCheckOutline16 size={10} />
            {t('settings.overridden')}
          </button>
        )}
      </div>
      <input
        id={`deepseek-balance-${field}`}
        className={css.fieldInput}
        type="text"
        spellCheck={false}
        value={shown}
        disabled={!editable}
        onChange={(event) => { setDraft(event.target.value) }}
        onBlur={commit}
        onKeyDown={(event) => { if (event.key === 'Enter') commit() }}
      />
      {hint !== undefined && <p className={css.fieldHint}>{hint}</p>}
    </div>
  )
}

/** One numeric field: commit parsed values on blur/Enter. */
function NumberField({ field, label, value, overridden, editable, onCommit, onRestore, t }: {
  field: string
  label: string
  value: number
  overridden: boolean
  editable: boolean
  onCommit: (next: number) => void
  onRestore: () => void
  t: (key: DeepseekBalanceKey) => string
}) {
  const [draft, setDraft] = useState<string | undefined>(undefined)
  const shown = draft ?? String(value)
  const commit = (): void => {
    if (draft !== undefined) {
      const parsed = Number(draft)
      if (Number.isFinite(parsed) && parsed >= 0) onCommit(parsed)
      setDraft(undefined)
    }
  }
  return (
    <div className={css.field}>
      <div className={css.fieldHead}>
        <label className={css.fieldLabel} htmlFor={`deepseek-balance-${field}`}>{label}</label>
        {overridden && (
          <button type="button" className={css.overlay} onClick={() => { onRestore() }} title={t('settings.restore')}>
            <IconCheckOutline16 size={10} />
            {t('settings.overridden')}
          </button>
        )}
      </div>
      <input
        id={`deepseek-balance-${field}`}
        className={css.fieldInput}
        type="number"
        min={0}
        step={1000}
        value={shown}
        disabled={!editable}
        onChange={(event) => { setDraft(event.target.value) }}
        onBlur={commit}
        onKeyDown={(event) => { if (event.key === 'Enter') commit() }}
      />
    </div>
  )
}
