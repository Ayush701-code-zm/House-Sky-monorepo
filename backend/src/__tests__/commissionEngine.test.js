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
  test('a 0-sale Advisor is not qualified', () => {
    expect(isRankQualified('Advisor', {
      selfSalesCount: 0, teamSalesCount: 0, activeLegsCount: 0
    })).toBe(false);
  });

  test('Advisor qualifies at 1 self sale', () => {
    expect(isRankQualified('Advisor', {
      selfSalesCount: 1, teamSalesCount: 0, activeLegsCount: 0
    })).toBe(true);
  });

  test('Team Leader needs 1 self and 2 team, with no leg requirement', () => {
    expect(isRankQualified('Team Leader', {
      selfSalesCount: 1, teamSalesCount: 2, activeLegsCount: 0
    })).toBe(true);
    expect(isRankQualified('Team Leader', {
      selfSalesCount: 1, teamSalesCount: 1, activeLegsCount: 0
    })).toBe(false);
  });

  test('Sales Director is not paid with zero sales', () => {
    expect(isRankQualified('Sales Director', {
      selfSalesCount: 0, teamSalesCount: 0, activeLegsCount: 0
    })).toBe(false);
  });

  test('Core Member needs 2 Sales Directors in the team', () => {
    expect(isRankQualified('Core Member', {
      selfSalesCount: 1, teamSalesCount: 500, activeLegsCount: 0, salesDirectorCount: 1
    })).toBe(false);
    expect(isRankQualified('Core Member', {
      selfSalesCount: 1, teamSalesCount: 500, activeLegsCount: 0, salesDirectorCount: 2
    })).toBe(true);
  });
});

describe('House & Sky commission table', () => {
  test('one table carries the poster rates', () => {
    expect(Object.keys(COMMISSION_TABLES)).toEqual(['HOUSE_AND_SKY']);
    expect(COMMISSION_TABLES.HOUSE_AND_SKY.Advisor).toBe(5);
    expect(COMMISSION_TABLES.HOUSE_AND_SKY['Team Leader']).toBe(8);
    expect(COMMISSION_TABLES.HOUSE_AND_SKY['Senior Team Leader']).toBe(10);
    expect(COMMISSION_TABLES.HOUSE_AND_SKY['Business Development Manager']).toBe(12);
    expect(COMMISSION_TABLES.HOUSE_AND_SKY['Sales Manager']).toBe(15);
    expect(COMMISSION_TABLES.HOUSE_AND_SKY['Senior Sales Manager']).toBe(18);
    expect(COMMISSION_TABLES.HOUSE_AND_SKY['Sales Director']).toBe(20);
    expect(COMMISSION_TABLES.HOUSE_AND_SKY['Core Member']).toBe(5);
  });

  test('tableToRankOverrides produces the eight poster ranks', () => {
    const overrides = tableToRankOverrides('HOUSE_AND_SKY');
    expect(overrides).toHaveLength(8);
    const leader = overrides.find((row) => row.rank === 'Team Leader');
    expect(leader.commissionPercent).toBe(8);
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
