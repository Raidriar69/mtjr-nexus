import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';

/**
 * POST /api/crypto/mark-paid
 *
 * Transitions crypto_manual orders from pending → waiting_confirmation.
 * The user calls this after broadcasting the on-chain payment.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderIds } = await req.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds required' }, { status: 400 });
    }

    await connectDB();

    // Only update orders that are still pending and belong to the crypto_manual flow
    const result = await Order.updateMany(
      {
        _id: { $in: orderIds },
        status: 'pending',
        cryptoManual: true,
      },
      { status: 'waiting_confirmation' }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No eligible orders found. Orders may already be submitted or not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, updated: result.modifiedCount });
  } catch (err: any) {
    console.error('[crypto/mark-paid]', err);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
