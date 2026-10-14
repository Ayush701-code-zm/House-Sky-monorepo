const { computePricing, deriveBaseRatePerSqYrd } = require('../services/pricingEngine');

describe('Pricing engine — reconciles with the client spreadsheet', () => {
  test('E5-83: no PLC, OTMC 250 -> GST is exactly 18% of OTMC charge, cost round-trips', () => {
    const inputs = { sellableSqYrd: 201.28, otmc: 250, totalCost: 1367510 };
    const base = deriveBaseRatePerSqYrd(inputs);
    const p = computePricing({ ...inputs, baseRatePerSqYrd: base });
    expect(p.otherCharges).toBeCloseTo(50320, 0); // 250 * 201.28
    expect(p.gstOnOtherCharges).toBeCloseTo(9057.6, 1); // 18% of 50320
    expect(p.totalCost).toBeCloseTo(1367510, 0); // reconstructs the sheet Total Cost
  });

  test('E5-80: discounted PLC 750 + OTMC 250 charged per sq-yrd, cost round-trips', () => {
    const inputs = { sellableSqYrd: 188.82, plc9mtr: 500, plcCorner: 500, discountedPlc: 750, otmc: 250, totalCost: 1449926 };
    const base = deriveBaseRatePerSqYrd(inputs);
    const p = computePricing({ ...inputs, baseRatePerSqYrd: base });
    expect(p.totalPlc).toBe(1000);
    expect(p.otherCharges).toBeCloseTo(188820, 0); // (750+250) * 188.82
    expect(p.gstOnOtherCharges).toBeCloseTo(33987.6, 1);
    expect(p.totalCost).toBeCloseTo(1449926, 0); // reconstructs the sheet Total Cost
  });

  test('falls back to Total PLC when no discount is given', () => {
    const p = computePricing({ sellableSqYrd: 100, plcCorner: 300, totalPlc: 300, otmc: 250 });
    // effective PLC = 300 (no discount) -> otherCharges = (300+250)*100 = 55000
    expect(p.otherCharges).toBe(55000);
    expect(p.gstOnOtherCharges).toBe(9900); // 18%
  });

  test('deriveBaseRatePerSqYrd inverts a known Total Cost consistently', () => {
    const inputs = { sellableSqYrd: 201.28, otmc: 250, totalCost: 1367510 };
    const base = deriveBaseRatePerSqYrd(inputs);
    const recomputed = computePricing({ ...inputs, baseRatePerSqYrd: base });
    expect(recomputed.totalCost).toBeCloseTo(1367510, 0); // round-trips exactly
  });

  test('zero sellable area yields zero charges (no crash)', () => {
    const p = computePricing({ sellableSqYrd: 0 });
    expect(p.totalCost).toBe(0);
    expect(p.gstOnOtherCharges).toBe(0);
  });
});
