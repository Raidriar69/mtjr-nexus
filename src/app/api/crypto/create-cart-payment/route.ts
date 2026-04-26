import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';

const NOWPAYMENTS_API = 'https://api.nowpayments.io/v1';

const COIN_CURRENCIES: Record<string, string> = {
  BTC: 'btc', ETH: 'eth', SOL: 'sol', LTC: 'ltc',
};

export async function POST(request: NextRequest) {
  try {
    const { productIds, buyerEmail, coin } = await request.json();

    if (!productIds?.length || !buyerEmail || !coin) {
      return NextResponse.json({ error: 'Products, email, and coin required' }, { status: 400 });
    }
    if (!COIN_CURRENCIES[coin]) {
      return NextResponse.json({ error: 'Unsupported coin' }, { status: 400 });
    }

    await connectDB();
    const session = await getServerSession(authOptions);
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const products = await Promise.all(productIds.map((id: string) => Product.findById(id)));
    if (products.some((p: any) => !p)) return NextResponse.json({ error: 'A product was not found' }, { status: 404 });
    const soldProduct = products.find((p: any) => p.isSold);
    if (soldProduct) return NextResponse.json({ error: `"${(soldProduct as any).title}" is already sold` }, { status: 409 });

    const total = products.reduce((s: number, p: any) => s + p.price, 0);

    // Create all pending orders
    const orders = await Promise.all(
      products.map((p: any) =>
        Order.create({
          userId: (session?.user as any)?.id,
          buyerEmail,
          productId: p._id,
          amount: Math.round(p.price * 100),
          currency: 'usd',
          status: 'pending',
          paymentMethod: 'crypto',
          cryptoCurrency: coin,
        })
      )
    );

    const orderIds = orders.map((o: any) => o._id.toString());
    const primaryOrderId = orderIds[0];

    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      await Order.deleteMany({ _id: { $in: orderIds } });
      return NextResponse.json(
        { error: 'Crypto payments not configured. Add NOWPAYMENTS_API_KEY to .env.local.' },
        { status: 503 }
      );
    }

    const nowRes = await fetch(`${NOWPAYMENTS_API}/invoice`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price_amount: total,
        price_currency: 'usd',
        pay_currency: COIN_CURRENCIES[coin],
        order_id: orderIds.join(','),   // comma-separated for multi-item
        order_description: products.length === 1
          ? (products[0] as any).title
          : `${products.length} Gaming Accounts — MTJR Nexus`,
        ipn_callback_url: `${origin}/api/crypto/webhook`,
        success_url: `${origin}/checkout/success?order_id=${primaryOrderId}&all_ids=${orderIds.join(',')}`,
        cancel_url: `${origin}/cart?cancelled=true`,
      }),
    });

    const nowData = await nowRes.json();
    if (!nowData.invoice_url) {
      await Order.deleteMany({ _id: { $in: orderIds } });
      throw new Error(nowData.message || 'Failed to create crypto invoice');
    }

    await Order.updateMany(
      { _id: { $in: orderIds } },
      { cryptoPaymentId: nowData.id }
    );

    return NextResponse.json({ url: nowData.invoice_url, orderIds, primaryOrderId });
  } catch (err: any) {
    console.error('Crypto cart payment error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
