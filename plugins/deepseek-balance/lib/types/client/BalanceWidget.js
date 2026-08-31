import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Sidebar footer-action balance widget: a compact badge showing the primary
 * currency total with an availability dot, a one-tap refresh, and a popover
 * panel with per-currency breakdowns, last-updated time, and the auto-refresh
 * toggle + interval. Mirrors the `sidebar.footer.action` shell geometry used
 * by ui-cordis: a 42px layer in wide mode, a 36px circular seat in the rail.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/BalanceWidget
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { IconApiOutline14, IconClockOutline16, IconLoadingOutline16, IconRefreshOutline16, IconWarningOutline16, StateDot, useDismissOnOutsidePointer, } from '@deepseek-ai/dsh-client-ui-primitives';
import { formatAmount, proportionOf } from "./format.js";
import css from './BalanceWidget.module.css';
/** Auto-refresh interval choices offered by the panel, in milliseconds. */
export const INTERVAL_OPTIONS = [30_000, 60_000, 600_000];
const INTERVAL_KEYS = {
    30_000: 'panel.interval.short',
    60_000: 'panel.interval.medium',
    600_000: 'panel.interval.long',
};
/** Availability dot state for one widget snapshot. */
function dotStateOf(state) {
    if (state.status === 'error')
        return 'error';
    if (state.snapshot === undefined)
        return 'ongoing';
    return state.snapshot.isAvailable ? 'done' : 'warning';
}
/** Availability pill label key for one snapshot. */
function availabilityKey(state) {
    if (state.snapshot === undefined)
        return 'availability.unknown';
    return state.snapshot.isAvailable ? 'availability.available' : 'availability.insufficient';
}
/** Pill tone matching the availability key. */
function availabilityTone(state) {
    const key = availabilityKey(state);
    if (key === 'availability.available')
        return 'available';
    if (key === 'availability.insufficient')
        return 'insufficient';
    return 'unknown';
}
/** Primary (first reported) currency total, when any exists. */
function primaryAmount(state) {
    const first = state.snapshot?.currencies[0];
    return first === undefined ? undefined : formatAmount(first.totalBalance, first.currency);
}
/** Compact "updated" label: the locale's clock time of the last successful read. */
function timeLabel(at) {
    return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
/**
 * Render the sidebar-foot balance action.
 * @param props - runtime `wide` seat, bound widget hooks, actions, and the `t` locale seat.
 */
export function BalanceWidget({ wide, useBalance, onRefresh, onToggleAutoRefresh, onSetIntervalMs, t, }) {
    const state = useBalance(snapshot => snapshot);
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const [anchor, setAnchor] = useState();
    useDismissOnOutsidePointer(rootRef, open, setOpen);
    // The panel is position: fixed (the sidebar clips overflow), so it hugs the
    // trigger through a measured offset instead of document flow.
    useLayoutEffect(() => {
        if (!open)
            return;
        const place = () => {
            const rect = rootRef.current?.getBoundingClientRect();
            if (rect !== undefined) {
                setAnchor({ left: rect.left, bottom: window.innerHeight - rect.top + 8 });
            }
        };
        place();
        window.addEventListener('resize', place);
        return () => { window.removeEventListener('resize', place); };
    }, [open]);
    const amount = primaryAmount(state);
    const interval = state.options?.refreshIntervalMs ?? 600_000;
    const autoRefresh = state.options?.autoRefresh ?? true;
    return (_jsxs("div", { className: wide ? css.layer : `${css.layer} ${css.rail}`, ref: rootRef, children: [wide
                ? (_jsxs("div", { className: css.footerButtons, children: [_jsxs("button", { type: "button", className: css.badge, "data-active": open || undefined, "aria-label": t('trigger.aria'), "aria-expanded": open, onClick: () => { setOpen(!open); }, children: [_jsx("span", { className: css.badgeIcon, children: _jsx(IconApiOutline14, { size: 14 }) }), _jsx("span", { className: css.badgeLabel, children: t('trigger.label') }), _jsx("span", { className: css.badgeAmount, children: amount ?? '—' }), _jsx("span", { className: css.badgeDot, children: _jsx(StateDot, { state: dotStateOf(state) }) })] }), _jsx("button", { type: "button", className: css.refresh, "aria-label": t('panel.refresh'), title: t('panel.refresh'), onClick: () => { onRefresh(); }, children: state.refreshing
                                ? _jsx(IconLoadingOutline16, { size: 14, className: css.spin })
                                : _jsx(IconRefreshOutline16, { size: 14 }) })] }))
                : (_jsxs("button", { type: "button", className: css.badge, "data-active": open || undefined, "aria-label": t('trigger.aria'), "aria-expanded": open, onClick: () => { setOpen(!open); }, children: [_jsx("span", { className: css.badgeIcon, children: _jsx(IconApiOutline14, { size: 14 }) }), _jsx("span", { className: css.railDot, children: _jsx(StateDot, { state: dotStateOf(state) }) })] })), open && anchor !== undefined && (_jsxs("div", { className: css.panel, style: { left: anchor.left, bottom: anchor.bottom }, children: [_jsxs("header", { className: css.panelHeader, children: [_jsx("span", { className: css.panelTitle, children: t('panel.title') }), _jsx("span", { className: css.pill, "data-tone": availabilityTone(state), children: t(availabilityKey(state)) })] }), _jsxs("div", { className: css.panelBody, children: [state.status === 'loading' && (_jsxs("div", { className: css.centerRow, children: [_jsx(IconLoadingOutline16, { size: 16, className: css.spin }), _jsx("span", { children: t('panel.loading') })] })), state.status === 'error' && (_jsxs("div", { className: css.errorBox, role: "alert", children: [_jsx(IconWarningOutline16, { size: 14 }), _jsx("span", { children: t('panel.readFailed', { message: state.error ?? '' }) }), _jsx("button", { type: "button", className: css.textButton, onClick: () => { onRefresh(); }, children: t('panel.retry') })] })), state.status === 'ready' && state.snapshot !== undefined && (_jsxs("div", { className: css.currencyList, children: [state.snapshot.currencies.length === 0 && (_jsx("div", { className: css.centerRow, children: t('panel.keyMissing') })), state.snapshot.currencies.map(entry => (_jsxs("div", { className: css.currencyBlock, children: [_jsxs("div", { className: css.currencyHeader, children: [_jsx("span", { className: css.currencyName, children: entry.currency }), _jsx("span", { className: css.currencyTotal, children: formatAmount(entry.totalBalance, entry.currency) })] }), _jsxs("div", { className: css.bar, "aria-hidden": "true", children: [_jsx("div", { className: css.barGranted, style: { width: `${proportionOf(entry.grantedBalance, entry.totalBalance) * 100}%` } }), _jsx("div", { className: css.barToppedUp, style: { width: `${proportionOf(entry.toppedUpBalance, entry.totalBalance) * 100}%` } })] }), _jsxs("div", { className: css.currencySub, children: [_jsxs("span", { children: [t('currency.granted'), _jsx("strong", { children: formatAmount(entry.grantedBalance, entry.currency) })] }), _jsxs("span", { children: [t('currency.toppedUp'), _jsx("strong", { children: formatAmount(entry.toppedUpBalance, entry.currency) })] })] })] }, entry.currency)))] }))] }), _jsxs("footer", { className: css.panelFooter, children: [_jsxs("div", { className: css.metaRow, children: [_jsx(IconClockOutline16, { size: 12 }), _jsx("span", { children: state.lastUpdated === undefined
                                            ? `${t('panel.lastUpdated')} ${t('panel.never')}`
                                            : `${t('panel.lastUpdated')} ${timeLabel(state.lastUpdated)}` }), _jsx("button", { type: "button", className: css.textButton, onClick: () => { onRefresh(); }, children: state.refreshing ? t('panel.loading') : t('panel.refresh') })] }), _jsxs("div", { className: css.autoRow, children: [_jsx("button", { type: "button", role: "switch", "aria-checked": autoRefresh, className: autoRefresh ? `${css.switch} ${css.switchOn}` : css.switch, onClick: () => { onToggleAutoRefresh(!autoRefresh); }, children: _jsx("span", { className: css.switchKnob }) }), _jsx("span", { className: css.autoLabel, children: t('panel.autoRefresh') }), _jsx("select", { className: css.intervalSelect, value: interval, disabled: !autoRefresh, "aria-label": t('panel.interval'), onChange: (event) => { onSetIntervalMs(Number(event.target.value)); }, children: INTERVAL_OPTIONS.map(option => (_jsx("option", { value: option, children: t(INTERVAL_KEYS[option] ?? 'panel.interval.medium') }, option))) })] })] })] }))] }));
}
//# sourceMappingURL=BalanceWidget.js.map