import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') return null;
  return session;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { appendAccounts, ...updateData } = body;

    await connectDB();

    let product;

    if (appendAccounts?.length) {
      // Append new bulk accounts and re-activate the listing if it was sold out
      product = await Product.findByIdAndUpdate(
        params.id,
        {
          ...updateData,
          $push: { accounts: { $each: appendAccounts } },
          isSold: false,
        },
        { new: true }
      );
    } else {
      product = await Product.findByIdAndUpdate(params.id, updateData, { new: true });
    }

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectDB();
    await Product.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Product deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
