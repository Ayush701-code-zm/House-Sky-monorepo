const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Employee = require('./models/Employee');
const Project = require('./models/Project');
const Plot = require('./models/Plot');
const Transaction = require('./models/Transaction');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/autoroma_perfume_realestate';

async function seed() {
  try {
    console.log('Connecting to MongoDB for seeding:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('Password123!', salt);

    // 1. Seed Admin User
    let adminUser = await User.findOne({ email: 'ankit@houseandsky.com' });
    if (!adminUser) {
      adminUser = await User.create({
        fullName: 'Ankit Kumar',
        email: 'ankit@houseandsky.com',
        password: defaultPassword,
        phone: '+91 9876543210',
        role: 'ADMIN'
      });
      console.log('Created Admin User: ankit@houseandsky.com');
    }

    let adminEmp = await Employee.findOne({ $or: [{ userId: adminUser._id }, { employeeCode: 'EMP-1000' }] });
    if (!adminEmp) {
      adminEmp = await Employee.create({
        userId: adminUser._id,
        employeeCode: 'EMP-1000',
        joiningDate: new Date(),
        currentRank: 'Director Sales',
        selfSalesCount: 15,
        teamSalesCount: 42,
        activeLegsCount: 4
      });
    }

    // 2. Seed Senior Agent User
    let agentUser = await User.findOne({ email: 'kabir.m@houseandsky.com' });
    if (!agentUser) {
      agentUser = await User.create({
        fullName: 'Kabir Merchant',
        email: 'kabir.m@houseandsky.com',
        password: defaultPassword,
        phone: '+91 98201 44556',
        role: 'AGENT'
      });
      console.log('Created Agent User: kabir.m@houseandsky.com');
    }

    let agentEmp = await Employee.findOne({ $or: [{ userId: agentUser._id }, { employeeCode: 'EMP-1001' }] });
    if (!agentEmp) {
      agentEmp = await Employee.create({
        userId: agentUser._id,
        employeeCode: 'EMP-1001',
        joiningDate: new Date(),
        currentRank: 'Associate Sales Director',
        parentId: adminEmp ? adminEmp._id : null,
        selfSalesCount: 8,
        teamSalesCount: 18,
        activeLegsCount: 2
      });
    }

    // 3. Seed Customer User
    let customerUser = await User.findOne({ email: 'vikramaditya@singhania.com' });
    if (!customerUser) {
      customerUser = await User.create({
        fullName: 'Vikramaditya Singhania',
        email: 'vikramaditya@singhania.com',
        password: defaultPassword,
        phone: '+91 98200 11223',
        role: 'USER'
      });
      console.log('Created Customer User: vikramaditya@singhania.com');
    }

    // 4. Seed Projects
    let project1 = await Project.findOne({ code: 'HS-BND' });
    if (!project1) {
      project1 = await Project.create({
        name: 'The Solitaire Sky Villa Enclave',
        code: 'HS-BND',
        location: 'Bandra West, Mumbai',
        totalAreaSqft: 150000,
        basePricePerSqft: 25000,
        totalPlots: 50,
        availablePlots: 35,
        bookedPlots: 10,
        soldPlots: 5,
        description: 'Ultra-luxury coastal land plot enclave in Bandra West.'
      });
      console.log('Created Project: The Solitaire Sky Villa Enclave');
    }

    let project2 = await Project.findOne({ code: 'HS-ASG' });
    if (!project2) {
      project2 = await Project.create({
        name: 'Casa de Assagao Coastal Enclave',
        code: 'HS-ASG',
        location: 'Assagao, North Goa',
        totalAreaSqft: 120000,
        basePricePerSqft: 18000,
        totalPlots: 40,
        availablePlots: 25,
        bookedPlots: 10,
        soldPlots: 5,
        description: 'Prime Portuguese heritage land plot enclave in North Goa.'
      });
      console.log('Created Project: Casa de Assagao Coastal Enclave');
    }

    // 5. Seed Land Plots
    let plot1 = await Plot.findOne({ plotNo: 'E5-104', projectId: project1._id });
    if (!plot1) {
      plot1 = await Plot.create({
        projectId: project1._id,
        block: 'Sector E5',
        plotNo: 'E5-104',
        sellableSqYrd: 201.28,
        carpetSqYrd: 104.48,
        sizeSqft: 1811,
        plc12mtr: 500000,
        plcCorner: 300000,
        plcParkFacing: 200000,
        totalPlc: 1000000,
        totalCost: 285000000,
        price: 285000000,
        paidAmount: 285000000,
        dueBalance: 0,
        status: 'SOLD',
        ownerName: 'Vikramaditya Singhania',
        ownerPhone: '+91 98200 11223',
        ownerEmail: 'vikramaditya@singhania.com',
        bookingDate: new Date('2026-08-14'),
        registryStatus: 'REGISTERED',
        paymentMilestones: [
          { title: '1st Token Booking Advance', amount: 100000000, dueDate: new Date('2026-08-01'), status: 'RECEIVED', paymentMode: 'RTGS' },
          { title: 'Final Title Conveyance Settlement', amount: 185000000, dueDate: new Date('2026-08-14'), status: 'RECEIVED', paymentMode: 'NET_BANKING' }
        ]
      });
      console.log('Created Plot: E5-104 (SOLD)');
    }

    let plot2 = await Plot.findOne({ plotNo: 'GA-208', projectId: project2._id });
    if (!plot2) {
      plot2 = await Plot.create({
        projectId: project2._id,
        block: 'Assagao Enclave',
        plotNo: 'GA-208',
        sellableSqYrd: 310.50,
        carpetSqYrd: 185.20,
        sizeSqft: 2794,
        plc12mtr: 200000,
        plcCorner: 0,
        plcParkFacing: 150000,
        totalPlc: 350000,
        totalCost: 142000000,
        price: 142000000,
        paidAmount: 50000000,
        dueBalance: 92000000,
        status: 'BOOKED',
        ownerName: 'Vikramaditya Singhania',
        ownerPhone: '+91 98200 11223',
        ownerEmail: 'vikramaditya@singhania.com',
        bookingDate: new Date('2026-08-20'),
        registryStatus: 'PENDING',
        paymentMilestones: [
          { title: '1st Token Booking Advance', amount: 50000000, dueDate: new Date('2026-08-20'), status: 'RECEIVED', paymentMode: 'NET_BANKING' },
          { title: '2nd Demarcation Installment', amount: 42000000, dueDate: new Date('2026-09-15'), status: 'PENDING', paymentMode: 'RTGS' },
          { title: 'Final Registry Settlement', amount: 50000000, dueDate: new Date('2026-10-30'), status: 'PENDING', paymentMode: 'CHEQUE' }
        ]
      });
      console.log('Created Plot: GA-208 (BOOKED)');
    }

    // 6. Seed Completed Transactions
    let txn1 = await Transaction.findOne({ plotId: plot1._id, status: 'COMPLETED' });
    if (!txn1) {
      txn1 = await Transaction.create({
        plotId: plot1._id,
        buyerName: 'Vikramaditya Singhania',
        buyerPhone: '+91 98200 11223',
        buyerEmail: 'vikramaditya@singhania.com',
        sellerEmployeeId: agentEmp ? agentEmp._id : null,
        amount: 285000000,
        paymentMode: 'NET_BANKING',
        status: 'COMPLETED',
        transactionDate: new Date('2026-08-14')
      });
      console.log('Created Agent-Assisted Transaction: TXN-884920');
    }

    let txn2 = await Transaction.findOne({ plotId: plot2._id });
    if (!txn2) {
      txn2 = await Transaction.create({
        plotId: plot2._id,
        buyerName: 'Vikramaditya Singhania',
        buyerPhone: '+91 98200 11223',
        buyerEmail: 'vikramaditya@singhania.com',
        sellerEmployeeId: null,
        amount: 50000000,
        paymentMode: 'NET_BANKING',
        status: 'COMPLETED',
        transactionDate: new Date('2026-08-20')
      });
      console.log('Created Direct Purchase Transaction: TXN-912048');
    }

    console.log('✅ Seed Script Finished Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Failed:', error);
    process.exit(1);
  }
}

seed();
