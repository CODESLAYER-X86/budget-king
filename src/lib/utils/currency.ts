/**
 * Format a number as Bangladeshi Taka.
 * User explicitly chose lowercase "tk" prefix.
 */
export function formatTk(amount: number | string | { toString(): string }): string {
  const n = typeof amount === "number" ? amount : parseFloat(String(amount));
  if (Number.isNaN(n)) return "tk 0";
  return `tk ${n.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

/**
 * Parse a string into a number, stripping non-digits.
 */
export function parseTk(value: string): number {
  const cleaned = value.replace(/[^\d.]/g, "");
  return parseFloat(cleaned) || 0;
}
