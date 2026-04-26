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
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get PayPal access token');
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { paypalOrderId } = await request.json();
    if (!paypalOrderId) {
      return NextResponse.json({ error: 'PayPal order ID required' }, { status: 400 });
    }

    const token = await getPayPalToken();

    // Capture the PayPal payment
    const captureRes = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const captureData = await captureRes.json();

    if (captureData.status !== 'COMPLETED') {
      throw new Error(`PayPal capture status: ${captureData.status || 'unknown'}`);
    }

    await connectDB();

    // Find the DB order
    const order = await Order.findOne({ paypalOrderId });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Idempotency — already completed
    if (order.status === 'completed') {
      return NextResponse.json({ orderId: order._id.toString() });
    }

    // Get product with credentials
    const product = await Product.findById(order.productId).select(
      '+accountEmail +accountPassword +accountInstructions'
    );
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Mark product sold + complete order
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

    // Send confirmation email (non-blocking)
    sendOrderConfirmation(order.buyerEmail, {
      productTitle: product.title,
      amount: order.amount,
      currency: order.currency,
      accountEmail: product.accountEmail,
      accountPassword: product.accountPassword,
      instructions: product.accountInstructions,
      orderId: order._id.toString(),
    }).catch((err) => console.error('Email send error:', err));

    return NextResponse.json({ orderId: order._id.toString() });
  } catch (err: any) {
    console.error('PayPal capture error:', err);
    return NextResponse.json({ error: err.message || 'Capture failed' }, { status: 500 });
  }
}
