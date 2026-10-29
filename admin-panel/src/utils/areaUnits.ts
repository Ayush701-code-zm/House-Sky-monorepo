/** Canonical area is square feet. 1 gaj = 1 square yard = 9 sq ft. */

export type AreaUnit = 'sqft' | 'gaj' | 'sqm' | 'acre';

export const AREA_UNITS: { id: AreaUnit; label: string; short: string }[] = [
  { id: 'sqft', label: 'Sq ft', short: 'SQFT' },
  { id: 'gaj', label: 'Gaj', short: 'GAJ' },
  { id: 'sqm', label: 'Sq meter', short: 'SQ M' },
  { id: 'acre', label: 'Acre', short: 'ACRE' },
];

const SQFT_PER: Record<AreaUnit, number> = {
  sqft: 1,
  gaj: 9,
  sqm: 10.76391041671,
  acre: 43560,
};

export function sqftToUnit(sqft: number, unit: AreaUnit): number {
  if (!sqft || !Number.isFinite(sqft)) return 0;
  return Math.round((sqft / SQFT_PER[unit]) * 100) / 100;
}

export function unitToSqft(value: number, unit: AreaUnit): number {
  if (!value || !Number.isFinite(value)) return 0;
  return Math.round(value * SQFT_PER[unit] * 100) / 100;
}

export function gajFromSqft(sqft: number): number {
  return sqftToUnit(sqft, 'gaj');
}

export function formatAreaSize(value: number, unit: AreaUnit): string {
  const short = AREA_UNITS.find((item) => item.id === unit)?.short || 'SQFT';
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return `${text} ${short}`;
}

export function unitTypeFor(unit: AreaUnit): string {
  if (unit === 'gaj') return 'GAJ';
  if (unit === 'sqm') return 'SQMT';
  if (unit === 'acre') return 'ACRE';
  return 'SQFT';
}

export function parseAreaSize(text: string): { value: number; unit: AreaUnit } | null {
  const match = String(text || '').trim().match(/^([\d,]+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  const raw = match[2].toUpperCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
  let unit: AreaUnit = 'sqft';
  if (!raw || /SQ\s*FT|SQFT|SFT/.test(raw)) unit = 'sqft';
  else if (/GAJ|GAZ|SQ\s*YD|SQYD|YARD/.test(raw)) unit = 'gaj';
  else if (/ACRE/.test(raw)) unit = 'acre';
  else if (/SQ\s*M|SQM|SQMT|METER|METRE|MTR|M2/.test(raw)) unit = 'sqm';
  return { value, unit };
}
