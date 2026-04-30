import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import { reserveAccountsForOrder } from '@/lib/orderCompletion';

/**
 * POST /api/crypto/mark-paid
 *
 * Transitions crypto_manual orders from pending → waiting_confirmation,
 * then immediately reserves the stock accounts for each bulk-product order.
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
      { $set: { status: 'waiting_confirmation' } }
    );

    if (result.modifiedCount === 0) {
      // May already be waiting — still ensure accounts are reserved
      const existingOrders = await Order.find({ _id: { $in: orderIds } }).lean() as any[];
      for (const order of existingOrders) {
        if (order.status === 'waiting_confirmation') {
          await reserveAccountsForOrder(String(order.productId), String(order._id), order.quantity ?? 1);
        }
      }
      return NextResponse.json({
        error: 'No eligible orders found. Orders may already be submitted or not found.',
      }, { status: 404 });
    }

    // Reserve bulk accounts for each newly-updated order
    const updatedOrders = await Order.find({
      _id: { $in: orderIds },
      status: 'waiting_confirmation',
    }).lean() as any[];

    const reservationErrors: string[] = [];

    for (const order of updatedOrders) {
      const ok = await reserveAccountsForOrder(
        String(order.productId),
        String(order._id),
        order.quantity ?? 1
      );
      if (!ok) {
        reservationErrors.push(String(order._id));
      }
    }

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount,
      ...(reservationErrors.length > 0 && {
        reservationWarning: `Insufficient stock for ${reservationErrors.length} order(s). Admin will need to handle manually.`,
        affectedOrders: reservationErrors,
      }),
    });
  } catch (err: any) {
    console.error('[crypto/mark-paid]', err);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
