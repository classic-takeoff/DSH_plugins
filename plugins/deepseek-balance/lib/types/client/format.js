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
export function parseAmount(value) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}
/**
 * Format one balance string with the user's locale and the currency's symbol.
 * @param value - decimal balance string.
 * @param currency - ISO 4217 currency code.
 * @returns the localized currency string, or a plain fallback for unknown currencies.
 */
export function formatAmount(value, currency) {
    const amount = parseAmount(value);
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }
    catch {
        return `${value} ${currency}`;
    }
}
/**
 * Fraction (0..1) of `part` within `total`, for proportion bars.
 * @param part - the part's decimal string.
 * @param total - the whole's decimal string.
 * @returns the clamped ratio, or 0 when the total is not positive.
 */
export function proportionOf(part, total) {
    const totalValue = parseAmount(total);
    if (totalValue <= 0)
        return 0;
    const ratio = parseAmount(part) / totalValue;
    return Math.min(1, Math.max(0, ratio));
}
//# sourceMappingURL=format.js.map