/**
 * FinLearn Administrative Account Provisioning Utility
 * 
 * Usage:
 *   1. Provision a new administrator:
 *      node scripts/createAdmin.js --create "Admin Name" "admin@finlearn.in" "AdminSecurePass123!"
 * 
 *   2. Promote an existing user to administrator:
 *      node scripts/createAdmin.js --promote "user@finlearn.in"
 * 
 * Invariant: Never allow public registration of admin accounts (prevents CWE-269).
 * Administrators must be provisioned securely via this direct CLI script.
 */

import { connectDatabase } from '../src/config/database.js';
import { User } from '../src/models/user.model.js';
import mongoose from 'mongoose';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one digit.';
  }
  return null;
}

async function run() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || (command !== '--create' && command !== '--promote')) {
    console.log(`
FinLearn Admin Provisioning CLI
---------------------------------
Commands:
  --create <name> <email> <password>    Create a new administrator account
  --promote <email>                    Promote an existing user to administrator role
`);
    process.exit(1);
  }

  const connected = await connectDatabase();
  if (!connected) {
    console.error('Failed to connect to MongoDB. Ensure mongod is running.');
    process.exit(1);
  }

  try {
    if (command === '--promote') {
      const email = args[1]?.trim().toLowerCase();
      if (!email || !EMAIL_REGEX.test(email)) {
        console.error('Error: Please provide a valid email address to promote.');
        process.exit(1);
      }

      const user = await User.findOne({ email });
      if (!user) {
        console.error(`Error: User with email "${email}" not found.`);
        process.exit(1);
      }

      if (user.role === 'admin') {
        console.log(`User "${email}" is already an administrator.`);
      } else {
        user.role = 'admin';
        user.accountStatus = 'active';
        await user.save();
        console.log(`\nSUCCESS: Promoted "${email}" (${user.name}) to administrator (role: 'admin').`);
      }
    } else if (command === '--create') {
      const name = args[1]?.trim();
      const email = args[2]?.trim().toLowerCase();
      const password = args[3];

      if (!name || name.length < 2) {
        console.error('Error: Name must be at least 2 characters.');
        process.exit(1);
      }
      if (!email || !EMAIL_REGEX.test(email)) {
        console.error('Error: Please provide a valid email address.');
        process.exit(1);
      }
      const pwError = validatePassword(password);
      if (pwError) {
        console.error(`Error: Invalid password - ${pwError}`);
        process.exit(1);
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.error(`Error: User with email "${email}" already exists. Use --promote if you want to promote them.`);
        process.exit(1);
      }

      const newAdmin = new User({
        name,
        email,
        passwordHash: password, // Will be hashed by pre-save hook with bcrypt cost 12
        role: 'admin',
        accountStatus: 'active',
      });

      await newAdmin.save();
      console.log(`\nSUCCESS: Administrator account "${email}" (${name}) provisioned successfully.`);
    }
  } catch (err) {
    console.error('Error executing admin provisioning:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
