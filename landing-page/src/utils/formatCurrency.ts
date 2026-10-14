import { formatCurrency as formatCurrencyINR } from './formatters';

/**
 * Formats price to INR string (e.g. 1500000 -> ₹15,00,000)
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  return formatCurrencyINR(amount);
}
