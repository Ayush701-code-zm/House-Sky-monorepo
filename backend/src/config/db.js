const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hippocrm');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    const users = conn.connection.collection('users');
    const indexes = await users.indexes();
    for (const index of indexes) {
      if (index.unique && index.key && index.key.email === 1) {
        await users.dropIndex(index.name);
      }
    }
    await users.createIndex({ email: 1 }, { name: 'email_1', unique: false });
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
