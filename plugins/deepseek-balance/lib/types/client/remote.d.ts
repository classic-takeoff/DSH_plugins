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
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
/** Remote descriptors for the three zero-argument balance methods. */
export declare const BALANCE_REMOTE: TypertRemoteContribution;
//# sourceMappingURL=remote.d.ts.map