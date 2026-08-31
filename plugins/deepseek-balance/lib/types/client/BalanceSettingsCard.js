import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Settings card for the `deepseek-balance` namespace: the fields the widget
 * behavior depends on (key reference, endpoint, auto-refresh, periods), the
 * credential status, and a live balance preview. Fields write immediately
 * through the revision-fenced settings scope; the user-document layer marks
 * overridden fields with a chip and a restore action.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/BalanceSettingsCard
 */
import { useState } from 'react';
import { IconApiOutline14, IconCheckOutline16, IconLoadingOutline16, IconRefreshOutline16, StateDot, } from '@deepseek-ai/dsh-client-ui-primitives';
import { formatAmount } from "./format.js";
import css from './BalanceSettingsCard.module.css';
/** Composition defaults mirrored from the Host schema, for display fallback. */
const FIELD_DEFAULTS = {
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    baseURL: 'https://api.deepseek.com',
    autoRefresh: true,
    refreshIntervalMs: 600_000,
    cacheTtlMs: 30_000,
    timeoutMs: 10_000,
};
const TEXT_FIELDS = ['apiKeyEnv', 'baseURL'];
const NUMBER_FIELDS = ['refreshIntervalMs', 'cacheTtlMs', 'timeoutMs'];
/** Availability tone for the preview row. */
function previewDot(state) {
    if (state.status === 'error')
        return 'error';
    if (state.snapshot === undefined)
        return 'ongoing';
    return state.snapshot.isAvailable ? 'done' : 'warning';
}
/**
 * Render the balance plugin card.
 * @param props - bound settings/balance hooks, field actions, and the `t` locale seat.
 */
export function BalanceSettingsCard({ useSettings, useBalance, onRefresh, onSetField, onUnsetField, t, }) {
    const settings = useSettings(snapshot => snapshot);
    const balance = useBalance(snapshot => snapshot);
    const editable = settings.status === 'ready' && settings.writable;
    const user = (settings.user ?? {});
    const value = settings.value ?? {};
    const fieldValue = (field) => value[field] ?? FIELD_DEFAULTS[field] ?? '';
    const isOverridden = (field) => Object.hasOwn(user, field);
    const first = balance.snapshot?.currencies[0];
    const previewAmount = first === undefined
        ? '—'
        : formatAmount(first.totalBalance, first.currency);
    return (_jsxs("div", { className: css.card, children: [_jsxs("header", { className: css.cardHeader, children: [_jsx("span", { className: css.cardIcon, children: _jsx(IconApiOutline14, { size: 14 }) }), _jsxs("div", { className: css.cardHeading, children: [_jsx("h3", { className: css.cardTitle, children: t('settings.title') }), _jsx("p", { className: css.cardDesc, children: t('settings.description') })] })] }), _jsxs("div", { className: css.fieldList, children: [TEXT_FIELDS.map(field => (_jsx(TextField, { field: field, label: t(field === 'apiKeyEnv' ? 'settings.apiKeyEnv' : 'settings.baseURL'), hint: field === 'apiKeyEnv' ? t('settings.apiKeyEnvHint') : undefined, value: String(fieldValue(field)), overridden: isOverridden(field), editable: editable, onCommit: (next) => { onSetField(field, next); }, onRestore: () => { onUnsetField(field); }, t: t }, field))), _jsxs("div", { className: css.fieldRow, children: [_jsx("span", { className: css.fieldLabel, children: t('settings.autoRefresh') }), _jsx("button", { type: "button", role: "switch", "aria-checked": fieldValue('autoRefresh') === true, disabled: !editable, className: fieldValue('autoRefresh') === true ? `${css.switch} ${css.switchOn}` : css.switch, onClick: () => { onSetField('autoRefresh', !(fieldValue('autoRefresh') === true)); }, children: _jsx("span", { className: css.switchKnob }) }), _jsx("span", { className: css.fieldLabel, children: t('settings.keyStatus') }), _jsx("span", { className: css.keyPill, "data-state": balance.options?.keyConfigured === true ? 'ok' : 'missing', children: balance.options?.keyConfigured === true
                                    ? t('settings.keyConfigured')
                                    : t('settings.keyNotConfigured') })] }), _jsx("div", { className: css.numberGrid, children: NUMBER_FIELDS.map(field => (_jsx(NumberField, { field: field, label: t(field === 'refreshIntervalMs'
                                ? 'settings.refreshInterval'
                                : field === 'cacheTtlMs'
                                    ? 'settings.cacheTtl'
                                    : 'settings.timeout'), value: Number(fieldValue(field)), overridden: isOverridden(field), editable: editable, onCommit: (next) => { onSetField(field, next); }, onRestore: () => { onUnsetField(field); }, t: t }, field))) })] }), _jsxs("footer", { className: css.preview, children: [_jsx("span", { className: css.previewLabel, children: t('settings.preview') }), _jsx("span", { className: css.previewDot, children: _jsx(StateDot, { state: previewDot(balance) }) }), _jsx("span", { className: css.previewAmount, children: previewAmount }), _jsx("button", { type: "button", className: css.previewRefresh, "aria-label": t('panel.refresh'), title: t('panel.refresh'), onClick: () => { onRefresh(); }, children: balance.refreshing
                            ? _jsx(IconLoadingOutline16, { size: 14, className: css.spin })
                            : _jsx(IconRefreshOutline16, { size: 14 }) })] })] }));
}
/** One text field: local draft, commit on blur/Enter, override chip + restore. */
function TextField({ field, label, hint, value, overridden, editable, onCommit, onRestore, t }) {
    const [draft, setDraft] = useState(undefined);
    const shown = draft ?? value;
    const commit = () => {
        if (draft !== undefined) {
            onCommit(draft);
            setDraft(undefined);
        }
    };
    return (_jsxs("div", { className: css.field, children: [_jsxs("div", { className: css.fieldHead, children: [_jsx("label", { className: css.fieldLabel, htmlFor: `deepseek-balance-${field}`, children: label }), overridden && (_jsxs("button", { type: "button", className: css.overlay, onClick: () => { onRestore(); }, title: t('settings.restore'), children: [_jsx(IconCheckOutline16, { size: 10 }), t('settings.overridden')] }))] }), _jsx("input", { id: `deepseek-balance-${field}`, className: css.fieldInput, type: "text", spellCheck: false, value: shown, disabled: !editable, onChange: (event) => { setDraft(event.target.value); }, onBlur: commit, onKeyDown: (event) => { if (event.key === 'Enter')
                    commit(); } }), hint !== undefined && _jsx("p", { className: css.fieldHint, children: hint })] }));
}
/** One numeric field: commit parsed values on blur/Enter. */
function NumberField({ field, label, value, overridden, editable, onCommit, onRestore, t }) {
    const [draft, setDraft] = useState(undefined);
    const shown = draft ?? String(value);
    const commit = () => {
        if (draft !== undefined) {
            const parsed = Number(draft);
            if (Number.isFinite(parsed) && parsed >= 0)
                onCommit(parsed);
            setDraft(undefined);
        }
    };
    return (_jsxs("div", { className: css.field, children: [_jsxs("div", { className: css.fieldHead, children: [_jsx("label", { className: css.fieldLabel, htmlFor: `deepseek-balance-${field}`, children: label }), overridden && (_jsxs("button", { type: "button", className: css.overlay, onClick: () => { onRestore(); }, title: t('settings.restore'), children: [_jsx(IconCheckOutline16, { size: 10 }), t('settings.overridden')] }))] }), _jsx("input", { id: `deepseek-balance-${field}`, className: css.fieldInput, type: "number", min: 0, step: 1000, value: shown, disabled: !editable, onChange: (event) => { setDraft(event.target.value); }, onBlur: commit, onKeyDown: (event) => { if (event.key === 'Enter')
                    commit(); } })] }));
}
//# sourceMappingURL=BalanceSettingsCard.js.map