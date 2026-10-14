/**
 * Plot pricing engine — the single formula for a plot's Total Cost.
 *
 * Derived from (and verified against) the client's pricing spreadsheet:
 *   - PLC sub-charges (12mtr/9mtr/corner/park) and OTMC are PER-SQ-YARD rates.
 *   - The PLC actually charged is the Discounted PLC rate (falls back to Total
 *     PLC when no discount is set).
 *   - "GST on other charges" = gstRate% of (PLC charge + OTMC charge).
 *   - Total Cost = base charge + other charges + GST, where
 *     base charge = baseRatePerSqYrd * sellableSqYrd.
 *
 * Verified example (E5-83): sellable 201.28, otmc 250, no PLC, base ~6499.86
 *   otherCharges = 250 * 201.28 = 50,320
 *   gst (18%)    = 9,057.60
 *   base         = 6499.86 * 201.28 = 1,308,132
 *   totalCost    = 1,367,510  ✓
 */

const DEFAULT_GST_RATE = 18; // percent, on PLC + OTMC charges

function roundMoney(amount) {
  return Math.round(((Number(amount) || 0) + Number.EPSILON) * 100) / 100;
}

/**
 * Compute all derived pricing fields from a plot's inputs.
 * Inputs may come from a Mongoose doc or a plain object.
 */
function computePricing(input = {}) {
  const sellableSqYrd = Number(input.sellableSqYrd) || 0;
  const plc12mtr = Number(input.plc12mtr) || 0;
  const plc9mtr = Number(input.plc9mtr) || 0;
  const plcCorner = Number(input.plcCorner) || 0;
  const plcParkFacing = Number(input.plcParkFacing) || 0;
  const otmc = Number(input.otmc) || 0;
  const baseRatePerSqYrd = Number(input.baseRatePerSqYrd) || 0;
  const gstRate = input.gstRate != null ? Number(input.gstRate) : DEFAULT_GST_RATE;

  const totalPlc = roundMoney(plc12mtr + plc9mtr + plcCorner + plcParkFacing);

  // Discounted PLC is the rate actually charged; fall back to list Total PLC.
  const discountedPlc = (input.discountedPlc != null && Number(input.discountedPlc) > 0)
    ? Number(input.discountedPlc)
    : totalPlc;

  const plcCharge = discountedPlc * sellableSqYrd;
  const otmcCharge = otmc * sellableSqYrd;
  const otherCharges = roundMoney(plcCharge + otmcCharge);
  const gstOnOtherCharges = roundMoney(otherCharges * (gstRate / 100));
  const baseCharge = roundMoney(baseRatePerSqYrd * sellableSqYrd);
  const totalCost = roundMoney(baseCharge + otherCharges + gstOnOtherCharges);

  return {
    sellableSqYrd,
    totalPlc,
    discountedPlc,
    otmc,
    baseCharge,
    plcCharge: roundMoney(plcCharge),
    otmcCharge: roundMoney(otmcCharge),
    otherCharges,
    gstRate,
    gstOnOtherCharges,
    totalCost
  };
}

/**
 * Given a KNOWN final total cost (e.g. imported from the client sheet), work
 * out the base rate/sq-yrd so future edits recompute consistently.
 */
function deriveBaseRatePerSqYrd(input = {}) {
  const sellableSqYrd = Number(input.sellableSqYrd) || 0;
  const knownTotalCost = Number(input.totalCost) || 0;
  if (sellableSqYrd <= 0 || knownTotalCost <= 0) return 0;

  const { otherCharges, gstOnOtherCharges } = computePricing({ ...input, baseRatePerSqYrd: 0 });
  const baseCharge = knownTotalCost - otherCharges - gstOnOtherCharges;
  if (baseCharge <= 0) return 0;
  return roundMoney(baseCharge / sellableSqYrd);
}

module.exports = {
  DEFAULT_GST_RATE,
  roundMoney,
  computePricing,
  deriveBaseRatePerSqYrd
};
