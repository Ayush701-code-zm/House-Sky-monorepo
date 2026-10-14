/**
 * Formatting Utilities for Hippo RealEstate Admin Panel & Landing Page
 */

/**
 * Formats monetary amounts in INR (Indian Rupee)
 * E.g., 1500000 -> ₹15,00,000 or ₹15.00 Lakh
 */
export function formatCurrency(
  amount?: number | string | null,
  options: { compact?: boolean; fallback?: string; allowZero?: boolean } = {}
): string {
  const { compact = false, fallback = 'Price on Request', allowZero = false } = options;

  if (amount === null || amount === undefined || amount === '') {
    return fallback;
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return fallback;
  }

  if (num === 0 && !allowZero) {
    return fallback;
  }

  if (compact) {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
}

/**
 * Formats plot areas in Sellable Sq Yrd & Carpet Sq Ft / Sq Yrd
 */
export function formatArea(
  sizeSqft?: number | string | null,
  sqyard?: number | string | null
): string {
  const sqftNum = typeof sizeSqft === 'string' ? parseFloat(sizeSqft) : sizeSqft;
  const sqydNum = typeof sqyard === 'string' ? parseFloat(sqyard) : sqyard;

  const validSqft = sqftNum && !isNaN(sqftNum) ? sqftNum : null;
  const validSqyd = sqydNum && !isNaN(sqydNum) ? sqydNum : (validSqft ? +(validSqft / 9).toFixed(2) : null);

  if (validSqyd && validSqft) {
    return `${validSqyd.toLocaleString('en-IN')} Sq Yrd (${validSqft.toLocaleString('en-IN')} Sq Ft)`;
  }
  if (validSqyd) {
    return `${validSqyd.toLocaleString('en-IN')} Sq Yrd`;
  }
  if (validSqft) {
    return `${validSqft.toLocaleString('en-IN')} Sq Ft`;
  }
  return '—';
}

/**
 * Formats dates into clean, human-friendly strings (e.g. 14 Aug 2026)
 */
export function formatDate(
  dateVal?: string | Date | number | null,
  options: { includeTime?: boolean; fallback?: string } = {}
): string {
  const { includeTime = false, fallback = '—' } = options;

  if (!dateVal) return fallback;

  const dateObj = new Date(dateVal);
  if (isNaN(dateObj.getTime())) return fallback;

  return dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

/**
 * Safely formats numbers with Indian grouping commas (e.g., 1,23,456)
 */
export function formatNumber(
  val?: number | string | null,
  fallback = '0'
): string {
  if (val === null || val === undefined || val === '') return fallback;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return fallback;
  return num.toLocaleString('en-IN');
}
