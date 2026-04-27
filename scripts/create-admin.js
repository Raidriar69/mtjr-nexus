/**
 * Create a custom admin account.
 * Usage: node scripts/create-admin.js <username> <password>
 * Example: node scripts/create-admin.js myusername mypassword123
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
      }
    }
  }
}

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.error('Usage: node scripts/create-admin.js <username> <password>');
  console.error('Example: node scripts/create-admin.js myname mypassword123');
  process.exit(1);
}

if (password.length < 8) {
  console.error('❌ Password must be at least 8 characters.');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:     { type: String },
  email:    { type: String, unique: true, sparse: true, lowercase: true },
  password: { type: String },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

async function main() {
  await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 30000,
    family: 4,
  });
  console.log('✅ Connected to MongoDB\n');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const exists = await User.findOne({ username: username.toLowerCase() });
  if (exists) {
    console.error(`❌ Username "${username}" already exists. Choose a different one.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 12);
  await User.create({
    username: username.toLowerCase(),
    name: username,
    password: hashed,
    role: 'admin',
  });

  console.log('✅ Admin created successfully!');
  console.log(`   Username : ${username.toLowerCase()}`);
  console.log(`   Password : ${password}`);
  console.log(`   Role     : admin`);
  console.log('\nYou can now log in at /login with these credentials.');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
