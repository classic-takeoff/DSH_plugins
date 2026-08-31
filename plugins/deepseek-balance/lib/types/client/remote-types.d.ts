/**
 * Typed client view of the `deepseekBalance` Remote namespace. Every method
 * resolves to the shared Remote result envelope; consumers branch on `ok`.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/remote-types
 */
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol';
import type { BalanceOptionsView, BalanceSnapshot } from '../types.ts';
/** Client-visible `deepseekBalance` namespace. */
export interface DeepseekBalanceRemote {
    /** Cached-or-fresh balance snapshot. */
    getBalance(): Promise<RemoteResult<BalanceSnapshot>>;
    /** Fresh balance snapshot, bypassing the host cache. */
    refreshBalance(): Promise<RemoteResult<BalanceSnapshot>>;
    /** Resolved plugin options plus credential availability — never the key. */
    getOptions(): Promise<RemoteResult<BalanceOptionsView>>;
}
/**
 * Human-readable message for one Remote failure, using the Host's own copy.
 * @param result - the failed Remote result.
 * @returns the failure message.
 */
export declare function balanceFailureMessage(result: {
    readonly ok: false;
    readonly error: {
        readonly message: string;
    };
}): string;
//# sourceMappingURL=remote-types.d.ts.map