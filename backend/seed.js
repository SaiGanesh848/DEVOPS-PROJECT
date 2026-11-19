const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const File = require('./models/File');
const Share = require('./models/Share');
const AuditLog = require('./models/AuditLog');

const seedUsers = [
  {
    name: 'System Administrator',
    email: 'admin@admin.com',
    password: 'Admin@123',
    role: 'admin',
    isActive: true,
  },
  {
    name: 'Alice Sender',
    email: 'sender1@test.com',
    password: 'Test@123',
    role: 'sender',
    isActive: true,
  },
  {
    name: 'Bob Sender',
    email: 'sender2@test.com',
    password: 'Test@123',
    role: 'sender',
    isActive: true,
  },
  {
    name: 'Charlie Recipient',
    email: 'recipient1@test.com',
    password: 'Test@123',
    role: 'recipient',
    isActive: true,
  },
  {
    name: 'Diana Recipient',
    email: 'recipient2@test.com',
    password: 'Test@123',
    role: 'recipient',
    isActive: true,
  },
  {
    name: 'Eve Auditor',
    email: 'auditor@test.com',
    password: 'Test@123',
    role: 'auditor',
    isActive: true,
  },
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/secure-file-transfer';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    for (const userData of seedUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`Created user: ${userData.email} (${userData.role})`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }

    console.log('\n=======================================');
    console.log('Database seeded successfully!');
    console.log('Default credentials:');
    console.log('  Admin:     admin@admin.com      / Admin@123');
    console.log('  Sender 1:  sender1@test.com     / Test@123');
    console.log('  Sender 2:  sender2@test.com     / Test@123');
    console.log('  Recipient: recipient1@test.com  / Test@123');
    console.log('  Recipient: recipient2@test.com  / Test@123');
    console.log('  Auditor:   auditor@test.com     / Test@123');
    console.log('=======================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
