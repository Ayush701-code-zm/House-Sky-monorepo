const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const Commission = require('../models/Commission');
const { processDifferentialCommission } = require('./commissionEngine');

/** 12:00 AM India time, as the client asked. The job does not sell plots. */
const CRON_EXPRESSION = '0 0 * * *';
const CRON_TIMEZONE = 'Asia/Kolkata';

let running = false;

/**
 * Pay any completed sale that does not already have commission rows.
 * Safe to run twice: a sale that was already calculated is left alone.
 */
async function runCommissionCalculation() {
  if (running) {
    return { skipped: true, reason: 'A calculation is already running.', processed: 0, created: 0, alreadyDone: 0, failed: [] };
  }
  running = true;
  const result = {
    skipped: false,
    startedAt: new Date(),
    processed: 0,
    created: 0,
    alreadyDone: 0,
    failed: []
  };
  try {
    const sales = await Transaction.find({
      status: 'COMPLETED',
      sellerEmployeeId: { $ne: null }
    }).select('_id');

    for (const sale of sales) {
      const exists = await Commission.exists({ transactionId: sale._id });
      if (exists) {
        result.alreadyDone += 1;
        continue;
      }
      try {
        const rows = await processDifferentialCommission(sale._id);
        result.processed += 1;
        result.created += Array.isArray(rows) ? rows.length : 0;
      } catch (error) {
        result.failed.push({ transactionId: String(sale._id), message: error.message });
      }
    }
    result.finishedAt = new Date();
    return result;
  } finally {
    running = false;
  }
}

function startCommissionCron() {
  if (process.env.DISABLE_COMMISSION_CRON === '1') return;
  cron.schedule(CRON_EXPRESSION, () => {
    runCommissionCalculation()
      .then((result) => {
        console.log(
          `Commission cron finished. processed ${result.processed}, created ${result.created}, already done ${result.alreadyDone}, failed ${result.failed.length}`
        );
      })
      .catch((error) => {
        console.error('Commission cron failed:', error.message);
      });
  }, { timezone: CRON_TIMEZONE });
  console.log(`Commission cron scheduled at 12:00 AM ${CRON_TIMEZONE}`);
}

module.exports = {
  CRON_EXPRESSION,
  CRON_TIMEZONE,
  runCommissionCalculation,
  startCommissionCron
};
