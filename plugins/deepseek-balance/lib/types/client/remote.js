/**
 * Browser-side Remote contribution for the `deepseekBalance` namespace. The
 * Host Gateway discovers the live `@Remote` methods itself (SRC fallback), so
 * this hand-built contribution only gives the browser client its wire
 * contract: strict zod codecs validate the JSON results the Host returns.
 * This mirrors the shape the Typert generator would emit, without requiring a
 * generation pass in the bundle pipeline.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/remote
 */
import { z } from 'zod';
const balanceCurrencySchema = z.object({
    currency: z.string(),
    totalBalance: z.string(),
    grantedBalance: z.string(),
    toppedUpBalance: z.string(),
});
const balanceSnapshotSchema = z.object({
    isAvailable: z.boolean(),
    fetchedAt: z.string(),
    currencies: z.array(balanceCurrencySchema),
});
const balanceOptionsSchema = z.object({
    apiKeyEnv: z.string(),
    baseURL: z.string(),
    autoRefresh: z.boolean(),
    refreshIntervalMs: z.number(),
    cacheTtlMs: z.number(),
    keyConfigured: z.boolean(),
});
/** Build one strict wire codec the Client Remote validation accepts. */
function strict(typeSymbol, schema) {
    return { mode: 'strict', typeSymbol, schema };
}
const PACKAGE = '@deepseek-ai/dsh-deepseek-balance';
const NS_URI = `${PACKAGE}#deepseekBalance`;
/** Remote descriptors for the three zero-argument balance methods. */
export const BALANCE_REMOTE = {
    package: PACKAGE,
    descriptors: [
        {
            id: `${NS_URI}/getBalance`,
            service: 'deepseekBalance',
            namespace: 'deepseekBalance',
            method: 'getBalance',
            invocation: { kind: 'direct' },
            parameters: [],
            result: strict(`${NS_URI}/getBalance:result`, balanceSnapshotSchema),
        },
        {
            id: `${NS_URI}/refreshBalance`,
            service: 'deepseekBalance',
            namespace: 'deepseekBalance',
            method: 'refreshBalance',
            invocation: { kind: 'direct' },
            parameters: [],
            result: strict(`${NS_URI}/refreshBalance:result`, balanceSnapshotSchema),
        },
        {
            id: `${NS_URI}/getOptions`,
            service: 'deepseekBalance',
            namespace: 'deepseekBalance',
            method: 'getOptions',
            invocation: { kind: 'direct' },
            parameters: [],
            result: strict(`${NS_URI}/getOptions:result`, balanceOptionsSchema),
        },
    ],
};
//# sourceMappingURL=remote.js.map