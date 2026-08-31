/**
 * Settings card for the `deepseek-balance` namespace: the fields the widget
 * behavior depends on (key reference, endpoint, auto-refresh, periods), the
 * credential status, and a live balance preview. Fields write immediately
 * through the revision-fenced settings scope; the user-document layer marks
 * overridden fields with a chip and a restore action.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/BalanceSettingsCard
 */
import type { InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { BalanceSettingsCardFace } from './slots.ts';
/** Full component props composed by the plugin-configuration tab. */
export type BalanceSettingsCardProps = InjectFace<BalanceSettingsCardFace> & PropsLocale<'deepseek-balance'>;
/**
 * Render the balance plugin card.
 * @param props - bound settings/balance hooks, field actions, and the `t` locale seat.
 */
export declare function BalanceSettingsCard({ useSettings, useBalance, onRefresh, onSetField, onUnsetField, t, }: BalanceSettingsCardProps): import("react").JSX.Element;
//# sourceMappingURL=BalanceSettingsCard.d.ts.map