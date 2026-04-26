import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { sendOrderConfirmation } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    let payload: Record<string, any>;
    try {
      payload = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Verify HMAC signature if configured
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
    if (ipnSecret) {
      const sig = request.headers.get('x-nowpayments-sig');
      if (sig) {
        const sorted = JSON.stringify(
          Object.fromEntries(Object.entries(payload).sort(([a], [b]) => a.localeCompare(b)))
        );
        const digest = crypto.createHmac('sha512', ipnSecret).update(sorted).digest('hex');
        if (digest !== sig) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const { order_id, payment_status } = payload;
    if (!['finished', 'confirmed'].includes(payment_status)) return NextResponse.json({ received: true });
    if (!order_id) return NextResponse.json({ received: true });

    await connectDB();

    // order_id may be comma-separated (cart checkout) or single
    const orderIds: string[] = String(order_id).split(',').filter(Boolean);

    for (const oid of orderIds) {
      const order = await Order.findById(oid);
      if (!order || order.status === 'completed') continue;

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

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Crypto webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
