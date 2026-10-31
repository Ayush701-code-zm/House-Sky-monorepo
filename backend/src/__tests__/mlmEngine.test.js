const { RANK_RULES } = require('../services/mlmEngine');

describe('House & Sky promotion plan', () => {
  test('defines the eight poster ranks', () => {
    expect(RANK_RULES.map((rule) => rule.rank).sort()).toEqual([
      'Advisor',
      'Business Development Manager',
      'Core Member',
      'Sales Director',
      'Sales Manager',
      'Senior Sales Manager',
      'Senior Team Leader',
      'Team Leader'
    ].sort());
  });

  test('Advisor is 1 self sale at 5%', () => {
    const advisor = RANK_RULES.find((rule) => rule.rank === 'Advisor');
    expect(advisor.commissionPercent).toBe(5);
    expect(advisor.minSelfSales).toBe(1);
    expect(advisor.minTeamSales).toBe(0);
    expect(advisor.minLegs).toBe(0);
  });

  test('Team Leader is 1 self and 2 team at 8%', () => {
    const rule = RANK_RULES.find((item) => item.rank === 'Team Leader');
    expect(rule.commissionPercent).toBe(8);
    expect(rule.minSelfSales).toBe(1);
    expect(rule.minTeamSales).toBe(2);
  });

  test('Senior Sales Manager must be reached within 90 days', () => {
    const rule = RANK_RULES.find((item) => item.rank === 'Senior Sales Manager');
    expect(rule.commissionPercent).toBe(18);
    expect(rule.minTeamSales).toBe(50);
    expect(rule.timeLimitDays).toBe(90);
  });

  test('Sales Director must be reached within 100 days', () => {
    const rule = RANK_RULES.find((item) => item.rank === 'Sales Director');
    expect(rule.commissionPercent).toBe(20);
    expect(rule.minSelfSales).toBe(1);
    expect(rule.minTeamSales).toBe(100);
    expect(rule.timeLimitDays).toBe(100);
    expect(rule.assignedOnly).toBe(false);
  });

  test('Core Member is 5% turnover plus 2 Sales Directors, not another 20%', () => {
    const rule = RANK_RULES.find((item) => item.rank === 'Core Member');
    expect(rule.commissionPercent).toBe(5);
    expect(rule.turnoverPercent).toBe(5);
    expect(rule.minSelfSales).toBe(1);
    expect(rule.minTeamSales).toBe(500);
    expect(rule.minSalesDirectors).toBe(2);
  });
});
