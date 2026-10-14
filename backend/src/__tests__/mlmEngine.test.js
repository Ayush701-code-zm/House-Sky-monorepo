const { RANK_RULES } = require('../services/mlmEngine');

describe('Hippo MLM Business Engine Rules Matrix Test', () => {
  test('Verify all 7 ranks are defined according to Hippo Business Rules', () => {
    expect(RANK_RULES.length).toBe(7);

    const ds = RANK_RULES.find(r => r.rank === 'Director Sales');
    expect(ds.commissionPercent).toBe(20);

    const asd = RANK_RULES.find(r => r.rank === 'Associate Sales Director');
    expect(asd.commissionPercent).toBe(18);
    expect(asd.minTeamSales).toBe(50);
    expect(asd.minLegs).toBe(3);
    expect(asd.timeLimitDays).toBe(60);

    const bdm = RANK_RULES.find(r => r.rank === 'Business Development Manager');
    expect(bdm.commissionPercent).toBe(15);
    expect(bdm.minSelfSales).toBe(1);
    expect(bdm.minTeamSales).toBe(20);

    const stl = RANK_RULES.find(r => r.rank === 'Sr Team Leader');
    expect(stl.commissionPercent).toBe(12);

    const tl = RANK_RULES.find(r => r.rank === 'Team Leader');
    expect(tl.commissionPercent).toBe(10);

    const sbe = RANK_RULES.find(r => r.rank === 'Sr Business Executive');
    expect(sbe.commissionPercent).toBe(8);

    const be = RANK_RULES.find(r => r.rank === 'Business Executive');
    expect(be.commissionPercent).toBe(5);
    expect(be.minSelfSales).toBe(2);
  });
});
