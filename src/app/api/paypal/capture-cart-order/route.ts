import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { sendOrderConfirmation } from '@/lib/email';

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

    // Find all pending orders tied to this PayPal order
    const orders = await Order.find({ paypalOrderId, status: 'pending' });
    if (!orders.length) return NextResponse.json({ error: 'Orders not found' }, { status: 404 });

    const completedOrderIds: string[] = [];

    for (const order of orders) {
      const product = await Product.findById(order.productId).select(
        '+accountEmail +accountPassword +accountInstructions'
      );
      if (!product) continue;

      await Promise.all([
        Product.findByIdAndUpdate(order.productId, { isSold: true }),
        Order.findByIdAndUpdate(order._id, {
          status: 'completed',
          deliveryDetails: {
            email: product.accountEmail,
            password: product.accountPassword,
            instructions: product.accountInstructions,
          },
        }),
      ]);

      completedOrderIds.push(order._id.toString());

      sendOrderConfirmation(order.buyerEmail, {
        productTitle: product.title,
        amount: order.amount,
        currency: order.currency,
        accountEmail: product.accountEmail,
        accountPassword: product.accountPassword,
        instructions: product.accountInstructions,
        orderId: order._id.toString(),
      }).catch(console.error);
    }

    return NextResponse.json({
      orderIds: completedOrderIds,
      primaryOrderId: completedOrderIds[0],
    });
  } catch (err: any) {
    console.error('PayPal capture-cart error:', err);
    return NextResponse.json({ error: err.message || 'Capture failed' }, { status: 500 });
  }
}
