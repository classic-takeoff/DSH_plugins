/**
 * Balance amount helpers shared by the browser surfaces.
 *
 * @module @deepseek-ai/dsh-deepseek-balance/client/format
 */
/**
 * Parse a decimal balance string to a number for bar math; malformed values read as 0.
 * @param value - decimal balance string.
 * @returns the parsed finite number, or 0.
 */
export declare function parseAmount(value: string): number;
/**
 * Format one balance string with the user's locale and the currency's symbol.
 * @param value - decimal balance string.
 * @param currency - ISO 4217 currency code.
 * @returns the localized currency string, or a plain fallback for unknown currencies.
 */
export declare function formatAmount(value: string, currency: string): string;
/**
 * Fraction (0..1) of `part` within `total`, for proportion bars.
 * @param part - the part's decimal string.
 * @param total - the whole's decimal string.
 * @returns the clamped ratio, or 0 when the total is not positive.
 */
export declare function proportionOf(part: string, total: string): number;
//# sourceMappingURL=format.d.ts.map