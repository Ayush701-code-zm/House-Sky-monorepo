require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Plot = require('../models/Plot');
const { applySoldStamps } = require('../services/ocrPipeline');

const PROJECT_ID = process.argv[2];
const NAKSHA_PATH = path.join(__dirname, '../../../landing-page/public/metro-green-naksha.jpg');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
  const plots = await Plot.find({ projectId: PROJECT_ID }).lean();
  const marked = await applySoldStamps(fs.readFileSync(NAKSHA_PATH), plots);
  let sold = 0;
  for (const plot of marked) {
    if (plot.status !== 'SOLD') continue;
    sold += 1;
    await Plot.findByIdAndUpdate(plot._id, { status: 'SOLD' });
    console.log('SOLD', plot.plotNo, plot.sellableSqYrd, plot.marker);
  }
  const counts = await Plot.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(PROJECT_ID) } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  console.log('marked', sold, 'db', counts);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
