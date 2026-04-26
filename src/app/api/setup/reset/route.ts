import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// Resets the first admin account's password — only usable if you can access the server
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { password } = await request.json();

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return NextResponse.json({ error: 'No admin account found' }, { status: 404 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(admin._id, { password: hashed });

    return NextResponse.json({ message: 'Password reset successfully', username: admin.username });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Reset failed' }, { status: 500 });
  }
}
