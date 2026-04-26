import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';

const PAYPAL_API =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) throw new Error('PayPal credentials not configured');

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
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
    const { productId, buyerEmail } = await request.json();

    if (!productId || !buyerEmail) {
      return NextResponse.json({ error: 'Product ID and email required' }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findById(productId);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.isSold) return NextResponse.json({ error: 'This account has already been sold' }, { status: 409 });

    const session = await getServerSession(authOptions);
    const token = await getPayPalToken();

    // Create PayPal order
    const paypalRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: product.price.toFixed(2),
            },
            description: `${product.game} — ${product.title}`,
            custom_id: productId.toString(),
          },
        ],
        application_context: {
          brand_name: 'MTJR Nexus',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
        },
      }),
    });

    const paypalOrder = await paypalRes.json();
    if (!paypalOrder.id) {
      throw new Error(paypalOrder.message || 'PayPal order creation failed');
    }

    // Create pending DB order
    const order = await Order.create({
      userId: (session?.user as any)?.id,
      buyerEmail,
      productId: product._id,
      amount: Math.round(product.price * 100),
      currency: 'usd',
      status: 'pending',
      paymentMethod: 'paypal',
      paypalOrderId: paypalOrder.id,
    });

    return NextResponse.json({
      paypalOrderId: paypalOrder.id,
      orderId: order._id.toString(),
    });
  } catch (err: any) {
    console.error('PayPal create-order error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create PayPal order' }, { status: 500 });
  }
}
