const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Employee = require('./models/Employee');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/autoroma_perfume_realestate';

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123456', salt);

    const emails = ['admin@houseandsky.com', 'admin@perfume.com'];

    for (const email of emails) {
      let admin = await User.findOne({ email });
      if (admin) {
        admin.password = hashedPassword;
        admin.role = 'ADMIN';
        admin.isActive = true;
        admin.approvalStatus = 'APPROVED';
        admin.isVerified = true;
        await admin.save();
        console.log(`Updated existing admin ${email}`);
      } else {
        admin = await User.create({
          fullName: 'Super Admin',
          email,
          password: hashedPassword,
          phone: '+91 9999999999',
          role: 'ADMIN',
          isActive: true,
          approvalStatus: 'APPROVED',
          isVerified: true
        });
        console.log(`Created admin ${email}`);
      }

      let emp = await Employee.findOne({ userId: admin._id });
      if (!emp) {
        await Employee.create({
          userId: admin._id,
          employeeCode: `H&S-${Math.floor(1000 + Math.random() * 9000)}`,
          joiningDate: new Date(),
          currentRank: 'Director Sales',
          selfSalesCount: 0,
          teamSalesCount: 0,
          activeLegsCount: 0
        });
        console.log(`Created Employee record for ${email}`);
      }
    }

    console.log('Admin accounts created/updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();
