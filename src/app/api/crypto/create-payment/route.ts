import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';

const NOWPAYMENTS_API = 'https://api.nowpayments.io/v1';

const COIN_CURRENCIES: Record<string, string> = {
  BTC: 'btc',
  ETH: 'eth',
  SOL: 'sol',
  LTC: 'ltc',
};

export async function POST(request: NextRequest) {
  try {
    const { productId, buyerEmail, coin } = await request.json();

    if (!productId || !buyerEmail || !coin) {
      return NextResponse.json(
        { error: 'Product ID, email, and coin are required' },
        { status: 400 }
      );
    }

    if (!COIN_CURRENCIES[coin]) {
      return NextResponse.json({ error: 'Unsupported cryptocurrency' }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findById(productId);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.isSold) {
      return NextResponse.json({ error: 'This account has already been sold' }, { status: 409 });
    }

    const session = await getServerSession(authOptions);
    const origin =
      request.headers.get('origin') ||
      process.env.NEXTAUTH_URL ||
      'http://localhost:3000';

    // Create pending DB order
    const order = await Order.create({
      userId: (session?.user as any)?.id,
      buyerEmail,
      productId: product._id,
      amount: Math.round(product.price * 100),
      currency: 'usd',
      status: 'pending',
      paymentMethod: 'crypto',
      cryptoCurrency: coin,
    });

    const apiKey = process.env.NOWPAYMENTS_API_KEY;

    if (!apiKey) {
      // Cleanup the pending order and return config error
      await Order.findByIdAndDelete(order._id);
      return NextResponse.json(
        {
          error:
            'Crypto payments are not yet configured. Add NOWPAYMENTS_API_KEY to your .env.local file.',
        },
        { status: 503 }
      );
    }

    // Create NOWPayments hosted invoice
    const nowRes = await fetch(`${NOWPAYMENTS_API}/invoice`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: product.price,
        price_currency: 'usd',
        pay_currency: COIN_CURRENCIES[coin],
        order_id: order._id.toString(),
        order_description: `${product.game} — ${product.title}`,
        ipn_callback_url: `${origin}/api/crypto/webhook`,
        success_url: `${origin}/checkout/success?order_id=${order._id}`,
        cancel_url: `${origin}/products/${productId}?cancelled=true`,
      }),
    });

    const nowData = await nowRes.json();

    if (!nowData.invoice_url) {
      await Order.findByIdAndDelete(order._id);
      throw new Error(nowData.message || 'Failed to create crypto invoice');
    }

    // Save NOWPayments invoice ID
    await Order.findByIdAndUpdate(order._id, { cryptoPaymentId: nowData.id });

    return NextResponse.json({
      url: nowData.invoice_url,
      orderId: order._id.toString(),
    });
  } catch (err: any) {
    console.error('Crypto create-payment error:', err);
    return NextResponse.json(
      { error: err.message || 'Crypto payment failed' },
      { status: 500 }
    );
  }
}
