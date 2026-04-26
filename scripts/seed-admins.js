/**
 * Admin Account Seeder
 * Creates 2 admin accounts with randomized usernames and strong passwords.
 *
 * Usage:
 *   node scripts/seed-admins.js
 *
 * Requires .env.local with MONGODB_URI set.
 */

const dns = require('dns');
// Override system DNS with Google + Cloudflare to fix SRV lookup issues on restricted networks
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Load .env.local manually
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

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI not found in .env.local');
  process.exit(1);
}

// ── Generators ────────────────────────────────────────────────────────────────

const ADJECTIVES = ['Shadow', 'Cyber', 'Ghost', 'Storm', 'Iron', 'Neon', 'Void', 'Dark', 'Apex', 'Ultra'];
const NOUNS      = ['Blade', 'Nexus', 'Phantom', 'Titan', 'Cipher', 'Wraith', 'Nova', 'Forge', 'Pulse', 'Hex'];

function randomUsername() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}${noun}${num}`.toLowerCase();
}

// Alphanumeric only — no special chars to avoid copy-paste issues
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
function generatePassword(length = 20) {
  let pwd = '';
  const upper  = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lower  = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  // Guarantee at least one uppercase, lowercase, digit
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  for (let i = 3; i < length; i++) {
    pwd += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

// ── Schema (inline — no TS transpile needed) ─────────────────────────────────

const UserSchema = new mongoose.Schema(
  {
    username:  { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:      { type: String },
    email:     { type: String, unique: true, sparse: true, lowercase: true },
    password:  { type: String },
    role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    family: 4, // force IPv4, avoids SRV/IPv6 DNS issues on some networks
  });
  console.log('✅  Connected to MongoDB\n');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const credentials = [];

  for (let i = 0; i < 2; i++) {
    let username;
    // Ensure unique username
    do {
      username = randomUsername();
    } while (await User.findOne({ username }));

    const plainPassword = generatePassword(24);
    const hashed = await bcrypt.hash(plainPassword, 12);

    const existing = await User.findOne({ username });
    if (existing) {
      console.log(`⚠️  Username ${username} already exists, skipping.`);
      continue;
    }

    await User.create({
      username,
      name: `Admin ${i + 1}`,
      password: hashed,
      role: 'admin',
    });

    credentials.push({ username, password: plainPassword });
    console.log(`✅  Admin ${i + 1} created`);
    console.log(`    Username : ${username}`);
    console.log(`    Password : ${plainPassword}`);
    console.log(`    Role     : admin\n`);
  }

  // Write credentials to a local file for safe-keeping (gitignored)
  const outputPath = path.join(__dirname, 'admin-credentials.txt');
  const lines = [
    '# GAMEVAULT ADMIN CREDENTIALS',
    '# Generated: ' + new Date().toISOString(),
    '# KEEP THIS FILE SECRET — DO NOT COMMIT',
    '',
    ...credentials.map((c, i) =>
      `Admin ${i + 1}\n  Username: ${c.username}\n  Password: ${c.password}`
    ),
  ];
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log(`📄  Credentials saved to scripts/admin-credentials.txt`);
  console.log('⚠️  Store these credentials securely and delete this file after saving them elsewhere!\n');

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error('Seeder error:', err);
  process.exit(1);
});
