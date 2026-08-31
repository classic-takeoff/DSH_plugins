/**
 * Browser half of `@deepseek-ai/dsh-deepseek-balance`: mounts the
 * `deepseekBalance` Remote contribution, then registers the sidebar
 * footer-action widget and the plugin-configuration settings card. Both
 * surfaces share one {@link BalanceWidgetController} observable, so a refresh
 * from the badge and one from the card always agree.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import type { DeepseekBalanceRemote } from './remote-types.ts';
export type { BalanceWidgetState, StateStore } from './controller.ts';
export type { BalanceSettingsView } from './settings-controller.ts';
export type { BalanceCurrencyView, BalanceOptionsView, BalanceSnapshot } from '../types.ts';
export type { BalanceWidgetFace, BalanceSettingsCardFace } from './slots.ts';
declare module '@deepseek-ai/dsh-api-gateway/client' {
    interface ClientRemote {
        /** Host balance reads owned by this plugin's bundle. */
        deepseekBalance: DeepseekBalanceRemote;
    }
}
/** Required browser services: Remote (mount + namespace), slots, locale, settings. */
export declare const inject: string[];
/**
 * Mount the balance Remote contribution, then register the browser surfaces
 * once the namespace service is live.
 * @param ctx - Client Cordis root.
 * @returns disposer unwinding both the UI and the Remote namespace.
 */
export declare function apply(ctx: ClientContext): Promise<() => Promise<void>>;
//# sourceMappingURL=index.d.ts.map