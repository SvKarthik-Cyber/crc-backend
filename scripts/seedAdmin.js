// One-time script: creates (or resets) a staff admin account directly in
// the database. Needed because there is no staff signup flow or UI yet -
// forwardToAdvisory / approvePoliceVerification both require a logged-in
// admin, and this is the only way to get one.
//
// Usage:  node scripts/seedAdmin.js
//
// Change ADMIN_EMAIL / ADMIN_PASSWORD below before running if you want
// different credentials. Safe to re-run - it just resets the password if
// the account already exists.

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const Admin = require('../src/models/Admin');

const ADMIN_EMAIL = 'admin@crc.local';
const ADMIN_PASSWORD = 'AdminPass123!';
const ADMIN_NAME = 'Test Admin';

async function seedAdmin() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set - check your .env file.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

  const admin = await Admin.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { name: ADMIN_NAME, email: ADMIN_EMAIL, passwordHash, role: 'admin' },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log('Admin account ready:');
  console.log('  email:   ', admin.email);
  console.log('  password:', ADMIN_PASSWORD);
  console.log('  role:    ', admin.role);
  console.log('\nLog in with POST /api/v1/staff/login using these credentials.');

  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Failed to seed admin account:', err);
  process.exit(1);
});