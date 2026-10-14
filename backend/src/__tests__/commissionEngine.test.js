const { roundMoney } = require('../services/commissionEngine');
const { isRankQualified } = require('../services/mlmEngine');
const { tableToRankOverrides, COMMISSION_TABLES } = require('../config/commissionPlans');

describe('roundMoney — integer-paise money safety', () => {
  test('rounds float-artifact commissions to 2 decimals', () => {
    // 1367510 * 8 / 100 = 109400.80000000001 in raw JS float
    expect(roundMoney((1367510 * 8) / 100)).toBe(109400.8);
    expect(roundMoney((1518928 * 7) / 100)).toBe(106324.96);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
});

describe('isRankQualified — under-qualified members earn nothing', () => {
  test('a 0-sale member labelled Business Executive is NOT qualified', () => {
    expect(isRankQualified('Business Executive', {
      selfSalesCount: 0, teamSalesCount: 0, activeLegsCount: 0
    })).toBe(false);
  });

  test('Business Executive qualifies at exactly 2 self sales', () => {
    expect(isRankQualified('Business Executive', {
      selfSalesCount: 2, teamSalesCount: 0, activeLegsCount: 0
    })).toBe(true);
  });

  test('Team Leader needs self>=2, team>=8, legs>=2', () => {
    expect(isRankQualified('Team Leader', {
      selfSalesCount: 2, teamSalesCount: 8, activeLegsCount: 2
    })).toBe(true);
    expect(isRankQualified('Team Leader', {
      selfSalesCount: 2, teamSalesCount: 7, activeLegsCount: 2
    })).toBe(false);
  });

  test('Director Sales is assign-only and always treated as qualified', () => {
    expect(isRankQualified('Director Sales', {
      selfSalesCount: 0, teamSalesCount: 0, activeLegsCount: 0
    })).toBe(true);
  });
});

describe('Per-project commission tables (Hippo Business Plan)', () => {
  test('three distinct tables exist with the plan rates', () => {
    expect(COMMISSION_TABLES.HIPPO_INFRA['Director Sales']).toBe(20);
    expect(COMMISSION_TABLES.RAMLOK['Director Sales']).toBe(15);
    expect(COMMISSION_TABLES.HIPPO_ENCLAVE['Director Sales']).toBe(12);

    expect(COMMISSION_TABLES.HIPPO_INFRA['Business Executive']).toBe(5);
    expect(COMMISSION_TABLES.RAMLOK['Business Executive']).toBe(5);
    expect(COMMISSION_TABLES.HIPPO_ENCLAVE['Business Executive']).toBe(2);
  });

  test('tableToRankOverrides produces a full 7-rank override array', () => {
    const overrides = tableToRankOverrides('RAMLOK');
    expect(overrides).toHaveLength(7);
    const tl = overrides.find((o) => o.rank === 'Team Leader');
    expect(tl.commissionPercent).toBe(9); // Ramlok TL = 9%, not the default 10%
  });
});

describe('Differential distribution math (rank% minus already-paid-below%)', () => {
  // Mirrors the engine's core arithmetic without a DB: an upline earns
  // max(0, theirRate - highestRatePaidBelow) of the sale amount.
  function differential(saleAmount, uplineRatesBottomUp) {
    let previousMax = 0;
    const payouts = [];
    for (const rate of uplineRatesBottomUp) {
      const diff = Math.max(0, rate - previousMax);
      if (diff > 0) {
        payouts.push(roundMoney((saleAmount * diff) / 100));
        previousMax = rate;
      } else {
        payouts.push(0);
      }
    }
    return payouts;
  }

  test('seller 5%, sponsor 10%, top 20% on a 1,000,000 sale', () => {
    // 5% -> 50000, +5% -> 50000, +10% -> 100000 ; total never exceeds top rate (20%)
    expect(differential(1000000, [5, 10, 20])).toEqual([50000, 50000, 100000]);
    const total = differential(1000000, [5, 10, 20]).reduce((a, b) => a + b, 0);
    expect(total).toBe(200000); // == 20% of sale, the top rank's full rate
  });

  test('an under-qualified sponsor (rate 0) absorbs no slice', () => {
    // seller 5%, unqualified sponsor 0%, top 10%
    expect(differential(1000000, [5, 0, 10])).toEqual([50000, 0, 50000]);
  });
});
