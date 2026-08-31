/**
 * Sidebar footer-action balance widget: a compact badge showing the primary
 * currency total with an availability dot, a one-tap refresh, and a popover
 * panel with per-currency breakdowns, last-updated time, and the auto-refresh
 * toggle + interval. Mirrors the `sidebar.footer.action` shell geometry used
 * by ui-cordis: a 42px layer in wide mode, a 36px circular seat in the rail.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/BalanceWidget
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { BalanceWidgetFace } from './slots.ts';
/** Full component props composed by the sidebar footer-action slot. */
export type BalanceWidgetProps = PropsRuntime<'sidebar.footer.action'> & InjectFace<BalanceWidgetFace> & PropsLocale<'deepseek-balance'>;
/** Auto-refresh interval choices offered by the panel, in milliseconds. */
export declare const INTERVAL_OPTIONS: readonly number[];
/**
 * Render the sidebar-foot balance action.
 * @param props - runtime `wide` seat, bound widget hooks, actions, and the `t` locale seat.
 */
export declare function BalanceWidget({ wide, useBalance, onRefresh, onToggleAutoRefresh, onSetIntervalMs, t, }: BalanceWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=BalanceWidget.d.ts.map