import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(req: NextRequest) {
  try {
    const { orderIds } = await req.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds required' }, { status: 400 });
    }

    await connectDB();

    // Only transition pending → waiting_confirmation for paypal_manual orders
    const result = await Order.updateMany(
      {
        _id: { $in: orderIds },
        paymentMethod: 'paypal_manual',
        status: 'pending',
      },
      { $set: { status: 'waiting_confirmation' } }
    );

    if (result.modifiedCount === 0) {
      // May already be in waiting_confirmation — that's fine
      return NextResponse.json({ success: true, alreadyMarked: true });
    }

    return NextResponse.json({ success: true, updated: result.modifiedCount });
  } catch (err: any) {
    console.error('mark-paid error:', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
