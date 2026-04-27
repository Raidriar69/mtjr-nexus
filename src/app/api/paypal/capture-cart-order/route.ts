import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import { completeOrder } from '@/lib/orderCompletion';

const PAYPAL_API =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getPayPalToken(): Promise<string> {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { paypalOrderId } = await request.json();
    if (!paypalOrderId) return NextResponse.json({ error: 'PayPal order ID required' }, { status: 400 });

    const token = await getPayPalToken();

    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const captureData = await captureRes.json();
    if (captureData.status !== 'COMPLETED') {
      throw new Error(`PayPal capture status: ${captureData.status}`);
    }

    await connectDB();

    const orders = await Order.find({ paypalOrderId, status: 'pending' });
    if (!orders.length) return NextResponse.json({ error: 'Orders not found' }, { status: 404 });

    // Complete each order using the shared utility
    await Promise.all(orders.map((o) => completeOrder(String(o._id))));

    const completedOrderIds = orders.map((o) => String(o._id));

    return NextResponse.json({
      orderIds: completedOrderIds,
      primaryOrderId: completedOrderIds[0],
    });
  } catch (err: any) {
    console.error('PayPal capture-cart error:', err);
    return NextResponse.json({ error: err.message || 'Capture failed' }, { status: 500 });
  }
}
