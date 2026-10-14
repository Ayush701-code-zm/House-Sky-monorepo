/**
 * Formats monetary amounts in INR for Landing Page
 */
export function formatCurrency(
  amount?: number | string | null,
  options: { compact?: boolean; fallback?: string } = {}
): string {
  const { compact = false, fallback = 'Price on Request' } = options;

  if (amount === null || amount === undefined || amount === '') {
    return fallback;
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num) || num === 0) {
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
