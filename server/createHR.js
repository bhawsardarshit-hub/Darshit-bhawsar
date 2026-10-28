
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing from .env');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to StaffSync database.');

  const setupKey = process.env.HR_SETUP_KEY;
  if (!setupKey) {
    throw new Error('Add HR_SETUP_KEY to server/.env first.');
  }

  const enteredKey = await ask('Enter your HR setup key: ');
  if (enteredKey !== setupKey) {
    throw new Error('Incorrect HR setup key.');
  }

  const name = (await ask('Enter HR name: ')).trim();
  const email = (await ask('Enter HR email: ')).trim().toLowerCase();
  const password = await ask('Enter HR password (minimum 8 characters): ');

  if (!name || !email || password.length < 8 || password.length > 72) {
    throw new Error('Invalid details. Check name, email, and password length.');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'HR';
    existing.password = await bcrypt.hash(password, 12);
    existing.name = name;
    await existing.save();
    console.log('Existing account updated to HR.');
  } else {
    await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: 'HR'
    });
    console.log('HR account created successfully.');
  }
}

main()
  .catch(error => console.error('Setup failed:', error.message))
  .finally(async () => {
    rl.close();
    await mongoose.disconnect().catch(() => {});
  });
