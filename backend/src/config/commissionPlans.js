/**
 * Source of truth for the Hippo "Business Promotion Plan".
 *
 * The plan PDF has THREE commission tables. The QUALIFICATION criteria
 * (self sales / team sales / legs / time-limit) are identical across all
 * three; only the commission PERCENTAGE per rank differs per project/scheme.
 *
 * Qualification lives in mlmEngine.RANK_RULES. These tables only carry the
 * per-project rate that overrides the default, and are wired to each project
 * via ProjectSettings.rankOverrides so rates stay fully dynamic/editable.
 */

const RANK_NAMES = [
  'Business Executive',
  'Sr Business Executive',
  'Team Leader',
  'Sr Team Leader',
  'Business Development Manager',
  'Associate Sales Director',
  'Director Sales'
];

// Page 1 — Hippo Infra (also the system default)
const HIPPO_INFRA = {
  'Business Executive': 5,
  'Sr Business Executive': 8,
  'Team Leader': 10,
  'Sr Team Leader': 12,
  'Business Development Manager': 15,
  'Associate Sales Director': 18,
  'Director Sales': 20
};

// Page 2 — Ramlok Hotels & Resorts
const RAMLOK = {
  'Business Executive': 5,
  'Sr Business Executive': 7,
  'Team Leader': 9,
  'Sr Team Leader': 11,
  'Business Development Manager': 13,
  'Associate Sales Director': 14,
  'Director Sales': 15
};

// Page 3 — Hippo Enclave, Indore
const HIPPO_ENCLAVE = {
  'Business Executive': 2,
  'Sr Business Executive': 4,
  'Team Leader': 6,
  'Sr Team Leader': 8,
  'Business Development Manager': 10,
  'Associate Sales Director': 11,
  'Director Sales': 12
};

const COMMISSION_TABLES = { HIPPO_INFRA, RAMLOK, HIPPO_ENCLAVE };

// Default table used when a project has no rank overrides configured.
const DEFAULT_TABLE_KEY = 'HIPPO_INFRA';

/** Convert a rate table into the ProjectSettings.rankOverrides array shape. */
function tableToRankOverrides(tableKey) {
  const table = COMMISSION_TABLES[tableKey] || HIPPO_INFRA;
  return RANK_NAMES.map((rank) => ({ rank, commissionPercent: table[rank] }));
}

module.exports = {
  RANK_NAMES,
  COMMISSION_TABLES,
  DEFAULT_TABLE_KEY,
  tableToRankOverrides
};
