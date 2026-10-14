const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Role = require('../models/Role');
const Employee = require('../models/Employee');
const Project = require('../models/Project');
const ProjectSettings = require('../models/ProjectSettings');
const Plot = require('../models/Plot');
const PlotMap = require('../models/PlotMap');
const CommissionPlan = require('../models/CommissionPlan');
const Transaction = require('../models/Transaction');
const Commission = require('../models/Commission');
const Payout = require('../models/Payout');
const Inquiry = require('../models/Inquiry');
const Notification = require('../models/Notification');
const { tableToRankOverrides } = require('../config/commissionPlans');
const { computePricing } = require('../services/pricingEngine');

dotenv.config();

// Safety Environment Guardrail
if (process.env.NODE_ENV === 'production') {
  console.error('❌ SEED ABORTED: Destructive seeding is strictly disabled in PRODUCTION environment!');
  process.exit(1);
}

const cleanSeedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/autoroma_perfume_realestate';
    console.log('Connecting to MongoDB for clean reset...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 30000 });
    console.log('MongoDB Connected!');

    // Clear dummy collections
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Transaction.deleteMany({});
    await Commission.deleteMany({});
    await Payout.deleteMany({});
    await Notification.deleteMany({});
    await Inquiry.deleteMany({});
    await Role.deleteMany({});
    await Project.deleteMany({});
    await ProjectSettings.deleteMany({});
    await Plot.deleteMany({});
    await PlotMap.deleteMany({});
    await CommissionPlan.deleteMany({});

    console.log('Cleared dummy agents, transactions, payouts, notifications, projects, and plots.');

    // 1. Roles
    await Role.insertMany([
      { name: 'ADMIN', permissions: ['all'] },
      { name: 'DIRECTOR', permissions: ['approve_payouts', 'view_reports', 'manage_projects'] },
      { name: 'MANAGER', permissions: ['manage_plots', 'view_tree', 'manage_leads'] },
      { name: 'AGENT', permissions: ['view_own_sales', 'create_booking', 'view_downline'] }
    ]);

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('Password123!', salt);

    // 2. Master Admin User & Employee
    const adminUser = await User.create({
      fullName: 'Ankit Kumar (Admin)',
      email: 'admin@hippoestates.com',
      password: defaultPassword,
      phone: '+91 98765 43210',
      role: 'ADMIN',
      isActive: true,
      approvalStatus: 'APPROVED'
    });

    const adminEmp = await Employee.create({
      userId: adminUser._id,
      employeeCode: 'EMP-1000',
      joiningDate: new Date('2023-01-01'),
      currentRank: 'Director Sales',
      selfSalesCount: 0,
      teamSalesCount: 0,
      activeLegsCount: 0,
      parentId: null
    });

    console.log('Created Master Admin User & Employee: admin@hippoestates.com (Password123!)');

    // 3. Commission Plans Matrix
    await CommissionPlan.insertMany([
      { rankName: 'Business Executive', minSelfSales: 2, minTeamSales: 0, minLegs: 0, timeLimitDays: 0, commissionPercent: 5 },
      { rankName: 'Sr Business Executive', minSelfSales: 2, minTeamSales: 5, minLegs: 2, timeLimitDays: 0, commissionPercent: 8 },
      { rankName: 'Team Leader', minSelfSales: 2, minTeamSales: 8, minLegs: 2, timeLimitDays: 0, commissionPercent: 10 },
      { rankName: 'Sr Team Leader', minSelfSales: 1, minTeamSales: 12, minLegs: 3, timeLimitDays: 0, commissionPercent: 12 },
      { rankName: 'Business Development Manager', minSelfSales: 1, minTeamSales: 20, minLegs: 3, timeLimitDays: 0, commissionPercent: 15 },
      { rankName: 'Associate Sales Director', minSelfSales: 0, minTeamSales: 50, minLegs: 3, timeLimitDays: 60, commissionPercent: 18 },
      { rankName: 'Director Sales', minSelfSales: 0, minTeamSales: 100, minLegs: 3, timeLimitDays: 0, commissionPercent: 20 }
    ]);

    // 4. Seed 3 Clean Master Projects with AVAILABLE plots for fresh testing
    const projectsData = [
      { name: 'Green Valley Enclave Phase 1', code: 'GVE-101', location: 'Sector 82, Gurgaon', city: 'Gurgaon', state: 'Haryana', totalAreaSqft: 450000, totalPlots: 35, basePricePerSqft: 4500, bannerImage: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?w=800&q=80' },
      { name: 'Royal Heritage Greens', code: 'RHG-102', location: 'Noida Expressway, Sector 144', city: 'Noida', state: 'Uttar Pradesh', totalAreaSqft: 600000, totalPlots: 40, basePricePerSqft: 5200, bannerImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80' },
      { name: 'Sunrise Vihar Township', code: 'SVT-103', location: 'Bihta Expressway, Patna', city: 'Patna', state: 'Bihar', totalAreaSqft: 350000, totalPlots: 30, basePricePerSqft: 2800, bannerImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80' }
    ];

    const blocks = ['Block A', 'Block B', 'Block C'];

    for (const pData of projectsData) {
      const proj = await Project.create({
        ...pData,
        status: 'ACTIVE',
        launchDate: new Date('2024-01-15'),
        createdBy: adminUser._id
      });
      await ProjectSettings.create({ projectId: proj._id });

      const vectorOverlayData = [];

      for (let i = 1; i <= proj.totalPlots; i++) {
        const block = blocks[i % blocks.length];
        const plotNo = `${block.replace(' ', '')}-${100 + i}`;
        const sizeSqft = 1200 + (i % 4) * 300;
        const sellableSqYrd = parseFloat((sizeSqft / 9 * 1.15).toFixed(2));
        const carpetSqYrd = parseFloat((sizeSqft / 9).toFixed(2));
        const baseRatePerSqYrd = proj.basePricePerSqft * 9;

        const rawPlot = { sellableSqYrd, baseRatePerSqYrd, otmc: 250 * sellableSqYrd, gstRate: 18 };
        const pricing = computePricing(rawPlot);

        const col = (i - 1) % 5;
        const row = Math.floor((i - 1) / 5);
        const x = 50 + col * 140;
        const y = 50 + row * 110;
        const points = [
          { x, y },
          { x: x + 125, y },
          { x: x + 125, y: y + 90 },
          { x, y: y + 90 }
        ];

        await Plot.create({
          projectId: proj._id,
          block,
          plotNo,
          sizeSqft,
          sellableSqYrd,
          carpetSqYrd,
          otmc: 250 * sellableSqYrd,
          gstOnOtherCharges: pricing.gstOnOtherCharges,
          baseRatePerSqYrd,
          totalCost: pricing.totalCost,
          price: pricing.totalCost,
          status: 'AVAILABLE',
          approvalStatus: 'APPROVED',
          coordinates: { x, y, width: 125, height: 90 },
          polygon: { points }
        });

        vectorOverlayData.push({
          plotNo,
          status: 'AVAILABLE',
          sizeSqft,
          totalCost: pricing.totalCost,
          polygonPoints: points,
          confidence: 0.98
        });
      }

      await PlotMap.create({
        projectId: proj._id,
        mapName: `${proj.name} Master Naksa Layout`,
        imageUrl: proj.bannerImage,
        vectorOverlayData,
        confidenceScore: 0.96,
        status: 'APPROVED'
      });
    }

    console.log('---------------------------------------------------------');
    console.log('✅ CLEAN RESET COMPLETE! Database ready for production/fresh setup.');
    console.log('Master Admin Credentials: admin@hippoestates.com / Password123!');
    console.log('---------------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning DB:', error);
    process.exit(1);
  }
};

cleanSeedDB();
