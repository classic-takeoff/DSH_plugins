/**
 * Browser half of `@deepseek-ai/dsh-deepseek-balance`: mounts the
 * `deepseekBalance` Remote contribution, then registers the sidebar
 * footer-action widget and the plugin-configuration settings card. Both
 * surfaces share one {@link BalanceWidgetController} observable, so a refresh
 * from the badge and one from the card always agree.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client
 */
import { BalanceSettingsCard } from "./BalanceSettingsCard.js";
import { BalanceWidget } from "./BalanceWidget.js";
import { BalanceWidgetController } from "./controller.js";
import { en, NS, zh } from "./locales.js";
import { BALANCE_REMOTE } from "./remote.js";
import { BalanceSettingsController } from "./settings-controller.js";
/** Required browser services: Remote (mount + namespace), slots, locale, settings. */
export const inject = ['remote', 'slots', 'locale', 'settingsScope'];
/**
 * Mount the balance Remote contribution, then register the browser surfaces
 * once the namespace service is live.
 * @param ctx - Client Cordis root.
 * @returns disposer unwinding both the UI and the Remote namespace.
 */
export async function apply(ctx) {
    const disposeRemote = await ctx.remote.$mount(BALANCE_REMOTE);
    const ui = ctx.inject(['remote', 'remote.deepseekBalance', 'slots', 'locale', 'settingsScope'], registerUi);
    try {
        await ui;
    }
    catch (error) {
        await ui.dispose();
        await disposeRemote();
        throw error;
    }
    return async () => {
        await ui.dispose();
        await disposeRemote();
    };
}
/** Register dictionaries, the shared widget controller, the footer action, and the settings card. */
function registerUi(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'deepseek-balance: dictionaries');
    const scope = ctx.settingsScope.bind({ namespace: NS });
    const remote = ctx.remote.deepseekBalance;
    const widget = new BalanceWidgetController(remote, scope);
    const card = new BalanceSettingsController(scope);
    ctx.effect(() => () => {
        widget.dispose();
        card.dispose();
    }, 'deepseek-balance: controllers');
    widget.start();
    ctx.effect(() => ctx.on('connection/reset', () => { widget.reset(); }), 'deepseek-balance: connection reset');
    const widgetFace = () => ({
        hooks: { balance: widget.hooks },
        onRefresh: () => { widget.refresh(true); },
        onToggleAutoRefresh: (enabled) => { widget.setField('autoRefresh', enabled); },
        onSetIntervalMs: (ms) => { widget.setField('refreshIntervalMs', ms); },
    });
    ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
        name: 'sidebar.footer.action',
        id: 'deepseek-balance',
        order: 10,
        locale: NS,
        inject: widgetFace,
    }, BalanceWidget));
    const cardFace = () => ({
        hooks: { settings: card.hooks, balance: widget.hooks },
        onRefresh: () => { widget.refresh(true); },
        onSetField: (field, value) => { card.setField(field, value); },
        onUnsetField: (field) => { card.unsetField(field); },
    });
    ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
        name: 'settings.plugin.item',
        key: NS,
        locale: NS,
        inject: cardFace,
    }, BalanceSettingsCard));
}
//# sourceMappingURL=index.js.map