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
const { processDifferentialCommission } = require('../services/commissionEngine');

dotenv.config();

// Safety Environment Guardrail
if (process.env.NODE_ENV === 'production') {
  console.error('❌ SEED ABORTED: Destructive seeding is strictly disabled in PRODUCTION environment!');
  process.exit(1);
}

const firstNames = [
  'Ankit', 'Rahul', 'Mohit', 'Vivek', 'Amit', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Neha',
  'Siddharth', 'Pooja', 'Karan', 'Ritu', 'Manish', 'Kavita', 'Deepak', 'Swati', 'Rajesh', 'Ananya',
  'Gaurav', 'Divya', 'Sanjay', 'Megha', 'Arjun', 'Bhavna', 'Nikhil', 'Shweta', 'Varun', 'Preeti',
  'Alok', 'Tarun', 'Shalini', 'Aman', 'Saurabh', 'Kriti', 'Aditya', 'Harsh', 'Radhika', 'Abhinav'
];

const lastNames = [
  'Kumar', 'Sharma', 'Verma', 'Singh', 'Patel', 'Gupta', 'Joshi', 'Mehta', 'Chawla', 'Bhasin',
  'Malhotra', 'Kapoor', 'Saxena', 'Bhatia', 'Aggarwal', 'Rao', 'Reddy', 'Nair', 'Mishra', 'Yadav',
  'Tripathi', 'Deshmukh', 'Choudhury', 'Pandey', 'Trivedi', 'Dutta'
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/autoroma_perfume_realestate';
    console.log('---------------------------------------------------------');
    console.log('🌱 Starting Realistic Indian Plot-Selling Database Seed');
    console.log(`Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 30000 });
    console.log('✅ MongoDB Connected Successfully!');

    // Clear existing collections safely for dev/test
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Project.deleteMany({});
    await ProjectSettings.deleteMany({});
    await Plot.deleteMany({});
    await PlotMap.deleteMany({});
    await CommissionPlan.deleteMany({});
    await Transaction.deleteMany({});
    await Commission.deleteMany({});
    await Payout.deleteMany({});
    await Inquiry.deleteMany({});
    await Notification.deleteMany({});

    console.log('🧹 Cleared all development collections.');

    // 1. Roles
    await Role.insertMany([
      { name: 'ADMIN', permissions: ['all'] },
      { name: 'DIRECTOR', permissions: ['approve_payouts', 'view_reports', 'manage_projects'] },
      { name: 'MANAGER', permissions: ['manage_plots', 'view_tree', 'manage_leads'] },
      { name: 'AGENT', permissions: ['view_own_sales', 'create_booking', 'view_downline'] }
    ]);

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('Password123!', salt);

    // 2. Core Administrative Test Users & Employees
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
      employeeCode: 'H&S-1000',
      joiningDate: new Date('2023-01-01'),
      currentRank: 'Director Sales',
      selfSalesCount: 18,
      teamSalesCount: 145,
      activeLegsCount: 6,
      parentId: null
    });

    const directorUser = await User.create({
      fullName: 'Vikramaditya Singhania (Director)',
      email: 'director@hippoestates.com',
      password: defaultPassword,
      phone: '+91 98200 11223',
      role: 'DIRECTOR',
      isActive: true,
      approvalStatus: 'APPROVED'
    });

    const directorEmp = await Employee.create({
      userId: directorUser._id,
      employeeCode: 'EMP-1001',
      joiningDate: new Date('2023-03-15'),
      currentRank: 'Associate Sales Director',
      selfSalesCount: 12,
      teamSalesCount: 84,
      activeLegsCount: 4,
      parentId: adminEmp._id
    });

    const managerUser = await User.create({
      fullName: 'Rajesh Sharma (Manager)',
      email: 'manager@hippoestates.com',
      password: defaultPassword,
      phone: '+91 98110 55443',
      role: 'MANAGER',
      isActive: true,
      approvalStatus: 'APPROVED'
    });

    const managerEmp = await Employee.create({
      userId: managerUser._id,
      employeeCode: 'EMP-1002',
      joiningDate: new Date('2023-06-01'),
      currentRank: 'Business Development Manager',
      selfSalesCount: 8,
      teamSalesCount: 38,
      activeLegsCount: 3,
      parentId: directorEmp._id
    });

    const agent1User = await User.create({
      fullName: 'Kabir Merchant (Senior Agent)',
      email: 'agent1@hippoestates.com',
      password: defaultPassword,
      phone: '+91 98201 44556',
      role: 'AGENT',
      isActive: true,
      approvalStatus: 'APPROVED'
    });

    const agent1Emp = await Employee.create({
      userId: agent1User._id,
      employeeCode: 'EMP-1003',
      joiningDate: new Date('2023-09-10'),
      currentRank: 'Sr Team Leader',
      selfSalesCount: 5,
      teamSalesCount: 16,
      activeLegsCount: 3,
      parentId: managerEmp._id
    });

    console.log('👤 Created Core Admin & Executive Logins:');
    console.log('   - ADMIN:    admin@hippoestates.com    (Password123!)');
    console.log('   - DIRECTOR: director@hippoestates.com (Password123!)');
    console.log('   - MANAGER:  manager@hippoestates.com  (Password123!)');
    console.log('   - AGENT:    agent1@hippoestates.com   (Password123!)');

    // 3. Create 50 Downline Employees in Multi-Tier MLM Network
    const createdEmployees = [adminEmp, directorEmp, managerEmp, agent1Emp];
    const totalEmps = 50;

    for (let i = 5; i <= totalEmps; i++) {
      const fName = getRandomItem(firstNames);
      const lName = getRandomItem(lastNames);
      const fullName = `${fName} ${lName}`;
      const email = `agent${i}@hippoestates.com`;

      const user = await User.create({
        fullName,
        email,
        password: defaultPassword,
        phone: `+91 ${9800000000 + i * 1111}`,
        role: 'AGENT',
        isActive: true,
        approvalStatus: 'APPROVED'
      });

      // Select sponsor parent to build clean MLM tree depth
      let parentIndex = 0;
      if (i > 5 && i <= 12) parentIndex = 1 + Math.floor(Math.random() * 3); // Under Director / Manager / Agent1
      else if (i > 12 && i <= 30) parentIndex = 4 + Math.floor(Math.random() * 8);
      else if (i > 30) parentIndex = 12 + Math.floor(Math.random() * 18);

      const parentEmp = createdEmployees[parentIndex] || adminEmp;

      const ranks = [
        'Business Executive',
        'Sr Business Executive',
        'Team Leader',
        'Sr Team Leader',
        'Business Development Manager'
      ];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];

      const emp = await Employee.create({
        userId: user._id,
        employeeCode: `EMP-${1000 + i}`,
        joiningDate: new Date(Date.now() - Math.floor(Math.random() * 200) * 86400000),
        currentRank: rank,
        selfSalesCount: Math.floor(Math.random() * 5),
        teamSalesCount: Math.floor(Math.random() * 15),
        activeLegsCount: Math.floor(Math.random() * 3),
        parentId: parentEmp._id
      });

      createdEmployees.push(emp);
    }

    console.log(`🌐 Created ${createdEmployees.length} Employees & Agents across 7 MLM Rank Tiers.`);

    // 4. Commission Plans Matrix
    await CommissionPlan.insertMany([
      { rankName: 'Business Executive', minSelfSales: 2, minTeamSales: 0, minLegs: 0, timeLimitDays: 0, commissionPercent: 5 },
      { rankName: 'Sr Business Executive', minSelfSales: 2, minTeamSales: 5, minLegs: 2, timeLimitDays: 0, commissionPercent: 8 },
      { rankName: 'Team Leader', minSelfSales: 2, minTeamSales: 8, minLegs: 2, timeLimitDays: 0, commissionPercent: 10 },
      { rankName: 'Sr Team Leader', minSelfSales: 1, minTeamSales: 12, minLegs: 3, timeLimitDays: 0, commissionPercent: 12 },
      { rankName: 'Business Development Manager', minSelfSales: 1, minTeamSales: 20, minLegs: 3, timeLimitDays: 0, commissionPercent: 15 },
      { rankName: 'Associate Sales Director', minSelfSales: 0, minTeamSales: 50, minLegs: 3, timeLimitDays: 60, commissionPercent: 18 },
      { rankName: 'Director Sales', minSelfSales: 0, minTeamSales: 100, minLegs: 3, timeLimitDays: 0, commissionPercent: 20 }
    ]);

    // 5. Realistic Fictional Indian Plot Projects (6 Projects)
    const projectsData = [
      {
        name: 'Green Valley Enclave Phase 1',
        code: 'GVE-101',
        location: 'Sector 82, Gurgaon',
        city: 'Gurgaon',
        state: 'Haryana',
        totalAreaSqft: 450000,
        totalPlots: 35,
        basePricePerSqft: 4500,
        bannerImage: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?w=800&q=80',
        description: 'Prime gated township plots with wide 12m internal roads, underground electrical cabling, and lush green parks.'
      },
      {
        name: 'Royal Heritage Greens',
        code: 'RHG-102',
        location: 'Noida Expressway, Sector 144',
        city: 'Noida',
        state: 'Uttar Pradesh',
        totalAreaSqft: 600000,
        totalPlots: 40,
        basePricePerSqft: 5200,
        bannerImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
        description: 'Luxury masterplan plot development adjacent to IT corridors, tech parks, and metro connectivity.'
      },
      {
        name: 'Sunrise Vihar Township',
        code: 'SVT-103',
        location: 'Bihta Expressway, Patna',
        city: 'Patna',
        state: 'Bihar',
        totalAreaSqft: 350000,
        totalPlots: 30,
        basePricePerSqft: 2800,
        bannerImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        description: 'High-growth potential demarcated plots located on Patna-Bihta commercial growth corridor.'
      },
      {
        name: 'Ganga Vihar Enclave',
        code: 'GVE-104',
        location: 'Gomti Nagar Extension, Lucknow',
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        totalAreaSqft: 500000,
        totalPlots: 35,
        basePricePerSqft: 3600,
        bannerImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
        description: 'Exclusive residential township plots near Shaheed Path, international stadium, and shopping arcades.'
      },
      {
        name: 'Eco Greens Meadows',
        code: 'EGM-105',
        location: 'Ratu Road, Ranchi',
        city: 'Ranchi',
        state: 'Jharkhand',
        totalAreaSqft: 300000,
        totalPlots: 25,
        basePricePerSqft: 2400,
        bannerImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        description: 'Serene eco-friendly plot development featuring rainwater harvesting, solar lighting, and 24/7 security.'
      },
      {
        name: 'Riverfront Orchid Enclave',
        code: 'ROE-106',
        location: 'Ajmer Road, Jaipur',
        city: 'Jaipur',
        state: 'Rajasthan',
        totalAreaSqft: 400000,
        totalPlots: 30,
        basePricePerSqft: 3200,
        bannerImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        description: 'Modern royal-theme plotting project with club house, tennis courts, and commercial front plazas.'
      }
    ];

    const planKeys = ['HIPPO_INFRA', 'RAMLOK', 'HIPPO_ENCLAVE'];
    const insertedProjects = [];

    for (let pi = 0; pi < projectsData.length; pi++) {
      const pData = projectsData[pi];
      const planKey = planKeys[pi % planKeys.length];
      const proj = await Project.create({
        ...pData,
        status: 'ACTIVE',
        launchDate: new Date('2024-01-15'),
        createdBy: adminUser._id
      });

      await ProjectSettings.create({
        projectId: proj._id,
        rankOverrides: tableToRankOverrides(planKey)
      });
      insertedProjects.push(proj);
    }

    console.log(`🏞️  Seeded ${insertedProjects.length} Masterplan Indian Real Estate Plot Projects.`);

    // 6. Realistic Plot Inventory Generation (approx. 200 Plots)
    let totalPlotsCount = 0;
    let availableCountTotal = 0;
    let pendingCountTotal = 0;
    let bookedCountTotal = 0;
    let soldCountTotal = 0;

    const blocks = ['Block A', 'Block B', 'Block C', 'Sector 1', 'Sector 2'];
    const soldTransactions = [];

    for (const proj of insertedProjects) {
      const vectorOverlayData = [];
      const numPlots = proj.totalPlots;

      for (let i = 1; i <= numPlots; i++) {
        totalPlotsCount++;
        const block = blocks[i % blocks.length];
        const plotNo = `${block.replace(' ', '')}-${100 + i}`;

        // Realistic plot status distribution: ~55% Available, ~12% Pending, ~15% Booked, ~18% Sold
        let status = 'AVAILABLE';
        if (i % 6 === 0) status = 'SOLD';
        else if (i % 7 === 0) status = 'BOOKED';
        else if (i % 9 === 0) status = 'PENDING';

        if (status === 'AVAILABLE') availableCountTotal++;
        if (status === 'PENDING') pendingCountTotal++;
        if (status === 'BOOKED') bookedCountTotal++;
        if (status === 'SOLD') soldCountTotal++;

        // Plot dimensions: 800, 1000, 1200, 1500, 1800, 2400 sqft
        const sizes = [800, 1000, 1200, 1500, 1800, 2400];
        const sizeSqft = sizes[i % sizes.length];
        const sellableSqYrd = parseFloat((sizeSqft / 9 * 1.15).toFixed(2));
        const carpetSqYrd = parseFloat((sizeSqft / 9).toFixed(2));
        const baseRatePerSqYrd = proj.basePricePerSqft * 9;

        // PLC Charges
        const plc12mtr = i % 3 === 0 ? 150 * sellableSqYrd : 0;
        const plc9mtr = i % 4 === 0 ? 80 * sellableSqYrd : 0;
        const plcCorner = i % 5 === 0 ? 200 * sellableSqYrd : 0;
        const plcParkFacing = i % 2 === 0 ? 100 * sellableSqYrd : 0;
        const otmc = 250 * sellableSqYrd;

        // Calculate plot cost using pricing engine logic
        const rawPlot = {
          sellableSqYrd,
          baseRatePerSqYrd,
          plc12mtr,
          plc9mtr,
          plcCorner,
          plcParkFacing,
          otmc,
          gstRate: 18
        };
        const pricing = computePricing(rawPlot);

        // Coordinates & Map vector polygon
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

        // Owner details if Booked or Sold
        let ownerName = '';
        let ownerPhone = '';
        let ownerEmail = '';
        let bookingDate = null;
        let paidAmount = 0;
        let dueBalance = pricing.totalCost;

        if (status === 'SOLD' || status === 'BOOKED') {
          ownerName = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
          ownerPhone = `+91 ${9820000000 + i * 23}`;
          ownerEmail = `${ownerName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
          bookingDate = new Date(Date.now() - (30 - i % 20) * 86400000);

          if (status === 'SOLD') {
            paidAmount = pricing.totalCost;
            dueBalance = 0;
          } else {
            paidAmount = Math.round(pricing.totalCost * 0.35);
            dueBalance = pricing.totalCost - paidAmount;
          }
        }

        const plot = await Plot.create({
          projectId: proj._id,
          block,
          plotNo,
          sizeSqft,
          sellableSqYrd,
          carpetSqYrd,
          plc12mtr,
          plc9mtr,
          plcCorner,
          plcParkFacing,
          totalPlc: pricing.totalPlc,
          otmc,
          gstOnOtherCharges: pricing.gstOnOtherCharges,
          baseRatePerSqYrd,
          totalCost: pricing.totalCost,
          price: pricing.totalCost,
          status,
          approvalStatus: 'APPROVED',
          coordinates: { x, y, width: 125, height: 90 },
          polygon: { points },
          ownerName,
          ownerPhone,
          ownerEmail,
          bookingDate,
          paidAmount,
          dueBalance,
          registryStatus: status === 'SOLD' ? 'REGISTERED' : status === 'BOOKED' ? 'PENDING' : 'NOT_REGISTERED',
          paymentMilestones: status === 'SOLD' || status === 'BOOKED' ? [
            { title: 'Token Booking Advance', amount: Math.round(pricing.totalCost * 0.15), dueDate: new Date('2024-02-01'), status: 'RECEIVED', paymentMode: 'NET_BANKING' },
            { title: 'Demarcation & Agreement Installment', amount: Math.round(pricing.totalCost * 0.35), dueDate: new Date('2024-03-01'), status: 'RECEIVED', paymentMode: 'RTGS' },
            { title: 'Registry Settlement', amount: Math.round(pricing.totalCost * 0.50), dueDate: new Date('2024-04-15'), status: status === 'SOLD' ? 'RECEIVED' : 'PENDING', paymentMode: 'CHEQUE' }
          ] : []
        });

        vectorOverlayData.push({
          plotNo,
          status,
          sizeSqft,
          totalCost: pricing.totalCost,
          polygonPoints: points,
          confidence: 0.98
        });

        // Store sold plot for transaction processing
        if (status === 'SOLD') {
          soldTransactions.push(plot);
        }
      }

      // Seed PlotMap (Naksa layout)
      await PlotMap.create({
        projectId: proj._id,
        mapName: `${proj.name} Master Naksa Layout`,
        imageUrl: proj.bannerImage,
        vectorOverlayData,
        confidenceScore: 0.96,
        status: 'APPROVED'
      });
    }

    console.log(`📐 Seeded ${totalPlotsCount} Plots across all projects:`);
    console.log(`   - AVAILABLE: ${availableCountTotal}`);
    console.log(`   - PENDING:   ${pendingCountTotal}`);
    console.log(`   - BOOKED:    ${bookedCountTotal}`);
    console.log(`   - SOLD:      ${soldCountTotal}`);

    // 7. Create Completed Transactions & Process Differential MLM Commissions
    console.log('💳 Processing Transactions & Differential MLM Commissions...');
    let totalCommissionsCreated = 0;

    for (let t = 0; t < soldTransactions.length; t++) {
      const plot = soldTransactions[t];
      // Select selling agent from created employees
      const sellerEmp = createdEmployees[t % createdEmployees.length];

      const tx = await Transaction.create({
        plotId: plot._id,
        buyerName: plot.ownerName,
        buyerPhone: plot.ownerPhone,
        buyerEmail: plot.ownerEmail,
        sellerEmployeeId: sellerEmp._id,
        amount: plot.totalCost,
        paymentMode: t % 2 === 0 ? 'NET_BANKING' : 'CHEQUE',
        status: 'COMPLETED',
        transactionDate: plot.bookingDate || new Date()
      });

      // Run automatic differential commission engine
      try {
        const comms = await processDifferentialCommission(tx._id);
        totalCommissionsCreated += comms.length;
      } catch (err) {
        console.error(`Commission calculation skipped for TX ${tx._id}:`, err.message);
      }
    }

    console.log(`💸 Generated ${soldTransactions.length} Transactions & ${totalCommissionsCreated} Differential Commission records.`);

    // 8. Seed Payouts
    const sampleCommissions = await Commission.find({ status: 'CALCULATED' }).limit(10);
    if (sampleCommissions.length > 0) {
      const topSeller = createdEmployees[1]; // Director / Top Agent
      const commIds = sampleCommissions.map(c => c._id);
      const totalPayoutAmt = sampleCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

      await Payout.create({
        employeeId: topSeller._id,
        amount: totalPayoutAmt,
        payoutDate: new Date(),
        status: 'COMPLETED',
        referenceNo: 'PAY-2026-8849',
        approvedBy: adminUser._id,
        bankDetails: {
          accountNumber: 'XXXXXX9842',
          ifscCode: 'HDFC0001024',
          bankName: 'HDFC Bank Ltd'
        },
        commissionIds: commIds
      });

      // Update commission status to PAID
      await Commission.updateMany(
        { _id: { $in: commIds } },
        { status: 'PAID' }
      );
    }

    // 9. Seed Public Inquiries & Agent Applications
    const inquiriesData = [
      { name: 'Rohan Deshmukh', email: 'rohan.d@example.com', phone: '+91 98920 12345', inquiryType: 'SITE_VISIT', message: 'Looking for a 1500 sqft plot in Green Valley Enclave Phase 1. Would like a site visit this Sunday.', status: 'NEW', source: 'LANDING_PAGE' },
      { name: 'Sneha Kapoor', email: 'sneha.k@example.com', phone: '+91 98111 67890', inquiryType: 'PROJECT_INQUIRY', message: 'Interested in Royal Heritage Greens plot pricing and payment plan details.', status: 'IN_PROGRESS', source: 'LANDING_PAGE' },
      { name: 'Manish Verma', email: 'manish.v@example.com', phone: '+91 98760 99887', inquiryType: 'PRICE_QUOTATION', message: 'Need quotation for 2400 sqft corner plot with 12m road PLC.', status: 'CONTACTED', source: 'LANDING_PAGE' },
      { name: 'Kavita Tripathi', email: 'kavita.t@example.com', phone: '+91 98230 44556', inquiryType: 'AGENT_APPLICATION', experienceYears: '3-5 Years', message: 'Experienced real estate consultant interested in joining the Hippo MLM advisory network.', status: 'NEW', source: 'BECOME_AGENT_FORM' },
      { name: 'Alok Pandey', email: 'alok.p@example.com', phone: '+91 98340 77654', inquiryType: 'CONTACT_FORM', message: 'Want to inquire about upcoming land plot launches in Patna Bihta Expressway.', status: 'CONVERTED', source: 'LANDING_PAGE' }
    ];

    for (const inq of inquiriesData) {
      await Inquiry.create({
        ...inq,
        projectId: insertedProjects[0]._id,
        projectName: insertedProjects[0].name,
        assignedAgentId: agent1Emp._id
      });
    }

    console.log(`📩 Seeded ${inquiriesData.length} Public Contact Leads & Agent Applications.`);
    console.log('---------------------------------------------------------');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('---------------------------------------------------------');
    console.log('📋 SUMMARY STATISTICS:');
    console.log(`   - Real Estate Projects:  ${insertedProjects.length}`);
    console.log(`   - Total Plots Seeded:   ${totalPlotsCount}`);
    console.log(`   - Available Plots:       ${availableCountTotal}`);
    console.log(`   - Pending Plots:         ${pendingCountTotal}`);
    console.log(`   - Booked Plots:          ${bookedCountTotal}`);
    console.log(`   - Sold Plots:            ${soldCountTotal}`);
    console.log(`   - Employees & Agents:    ${createdEmployees.length}`);
    console.log(`   - Transactions:          ${soldTransactions.length}`);
    console.log(`   - Commissions Created:   ${totalCommissionsCreated}`);
    console.log('---------------------------------------------------------');
    console.log('🔑 TEST LOGIN CREDENTIALS (Password: Password123!):');
    console.log('   - ADMIN:    admin@hippoestates.com');
    console.log('   - DIRECTOR: director@hippoestates.com');
    console.log('   - MANAGER:  manager@hippoestates.com');
    console.log('   - AGENT:    agent1@hippoestates.com');
    console.log('---------------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding DB:', error);
    process.exit(1);
  }
};

seedDB();
