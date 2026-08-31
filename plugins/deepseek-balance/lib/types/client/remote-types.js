/**
 * Typed client view of the `deepseekBalance` Remote namespace. Every method
 * resolves to the shared Remote result envelope; consumers branch on `ok`.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/remote-types
 */
/**
 * Human-readable message for one Remote failure, using the Host's own copy.
 * @param result - the failed Remote result.
 * @returns the failure message.
 */
export function balanceFailureMessage(result) {
    return result.error.message;
}
//# sourceMappingURL=remote-types.js.map