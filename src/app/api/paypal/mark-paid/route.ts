import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import { reserveAccountsForOrder } from '@/lib/orderCompletion';

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
      // May already be in waiting_confirmation — that's fine, still try reservation
      const existingOrders = await Order.find({ _id: { $in: orderIds } }).lean() as any[];
      for (const order of existingOrders) {
        if (order.status === 'waiting_confirmation') {
          await reserveAccountsForOrder(String(order.productId), String(order._id), order.quantity ?? 1);
        }
      }
      return NextResponse.json({ success: true, alreadyMarked: true });
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
    console.error('paypal/mark-paid error:', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
