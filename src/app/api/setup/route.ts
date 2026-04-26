import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// One-time setup route — creates the first admin account.
// Automatically locks itself once any admin exists in the DB.
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Block if an admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Setup already complete. An admin account already exists.' },
        { status: 403 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }
    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const taken = await User.findOne({ username: username.toLowerCase() });
    if (taken) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin = await User.create({
      username: username.toLowerCase(),
      name: 'Admin',
      password: hashed,
      role: 'admin',
    });

    return NextResponse.json({
      message: 'Admin account created successfully',
      username: admin.username,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Setup failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const existingAdmin = await User.findOne({ role: 'admin' });
    return NextResponse.json({
      setupRequired: !existingAdmin,
      username: existingAdmin?.username ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
