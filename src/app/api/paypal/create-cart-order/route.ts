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
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get PayPal token');
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { productIds, quantities: rawQty, buyerEmail } = await request.json();

    if (!productIds?.length || !buyerEmail) {
      return NextResponse.json({ error: 'Products and email required' }, { status: 400 });
    }

    const quantities: number[] = productIds.map((_: string, i: number) =>
      Math.max(1, Number(rawQty?.[i]) || 1)
    );

    await connectDB();
    const session = await getServerSession(authOptions);

    const products = await Promise.all(productIds.map((id: string) => Product.findById(id)));
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p) return NextResponse.json({ error: 'A product was not found' }, { status: 404 });
      if (p.productType === 'bulk') {
        const stockCount = ((p.accounts ?? []) as any[]).filter((a: any) => !a.sold).length;
        if (stockCount < quantities[i]) {
          return NextResponse.json(
            { error: `"${p.title}" only has ${stockCount} account(s) in stock (requested ${quantities[i]})` },
            { status: 409 }
          );
        }
      } else if (p.isSold) {
        return NextResponse.json({ error: `"${p.title}" is already sold` }, { status: 409 });
      }
    }

    // Total = sum of (price × qty) for all items
    const total = products.reduce((s: number, p: any, i: number) => s + p.price * quantities[i], 0);

    const token = await getPayPalToken();

    const paypalRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: total.toFixed(2) },
          description: products.length === 1
            ? `${products[0].title}${quantities[0] > 1 ? ` ×${quantities[0]}` : ''}`
            : `${products.length} Gaming Accounts — MTJR Nexus`,
          custom_id: productIds.join(','),
        }],
        application_context: {
          brand_name: 'MTJR Nexus',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
        },
      }),
    });

    const paypalOrder = await paypalRes.json();
    if (!paypalOrder.id) throw new Error(paypalOrder.message || 'PayPal order creation failed');

    // Create pending DB orders with per-item amounts and quantities
    const orders = await Promise.all(
      products.map((p: any, i: number) =>
        Order.create({
          userId: (session?.user as any)?.id,
          buyerEmail,
          productId: p._id,
          amount: Math.round(p.price * quantities[i] * 100),
          currency: 'usd',
          status: 'pending',
          paymentMethod: 'paypal',
          paypalOrderId: paypalOrder.id,
          quantity: quantities[i],
        })
      )
    );

    return NextResponse.json({
      paypalOrderId: paypalOrder.id,
      orderIds: orders.map((o: any) => o._id.toString()),
    });
  } catch (err: any) {
    console.error('PayPal create-cart-order error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
