/**
 * House & Sky Business Promotion Plan. One table for every project.
 * Core Member's 5% is turnover, not a differential step above Sales Director.
 */

const RANK_NAMES = [
  'Advisor',
  'Team Leader',
  'Senior Team Leader',
  'Business Development Manager',
  'Sales Manager',
  'Senior Sales Manager',
  'Sales Director',
  'Core Member'
];

const HOUSE_AND_SKY = {
  Advisor: 5,
  'Team Leader': 8,
  'Senior Team Leader': 10,
  'Business Development Manager': 12,
  'Sales Manager': 15,
  'Senior Sales Manager': 18,
  'Sales Director': 20,
  'Core Member': 5
};

const COMMISSION_TABLES = { HOUSE_AND_SKY };
const DEFAULT_TABLE_KEY = 'HOUSE_AND_SKY';

function tableToRankOverrides(tableKey) {
  const table = COMMISSION_TABLES[tableKey] || HOUSE_AND_SKY;
  return RANK_NAMES.map((rank) => ({ rank, commissionPercent: table[rank] }));
}

module.exports = {
  RANK_NAMES,
  COMMISSION_TABLES,
  DEFAULT_TABLE_KEY,
  HOUSE_AND_SKY,
  tableToRankOverrides
};
