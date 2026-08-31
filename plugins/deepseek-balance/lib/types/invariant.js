/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-deepseek-balance`.
 * @module @deepseek-ai/dsh-deepseek-balance/invariant
 */
const PACKAGE_NAME = '@deepseek-ai/dsh-deepseek-balance';
/** Cordis companion plugin name. */
export const name = 'deepseek-balance-invariant';
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants'];
/**
 * No runtime invariant: every mutable relation this package owns — the host
 * snapshot cache and the browser widget observable — lives inside a single
 * process plane (Host or browser), is proven disposable by unit tests, and
 * never crosses a plugin boundary. The Remote namespace is stateless by
 * design: three zero-argument reads with no scoped contexts to leak.
 */
const install = () => { };
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map