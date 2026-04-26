import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { sendOrderConfirmation } from '@/lib/email';

export const config = { api: { bodyParser: false } };

async function completeOrder(orderId: string, productId: string, paymentIntentId: string) {
  const product = await Product.findById(productId).select(
    '+accountEmail +accountPassword +accountInstructions'
  );
  if (!product) return;

  await Product.findByIdAndUpdate(productId, { isSold: true });

  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      status: 'completed',
      stripePaymentIntentId: paymentIntentId,
      deliveryDetails: {
        email: product.accountEmail,
        password: product.accountPassword,
        instructions: product.accountInstructions,
      },
    },
    { new: true }
  );

  if (order) {
    sendOrderConfirmation(order.buyerEmail, {
      productTitle: product.title,
      amount: order.amount,
      currency: order.currency,
      accountEmail: product.accountEmail,
      accountPassword: product.accountPassword,
      instructions: product.accountInstructions,
      orderId: order._id.toString(),
    }).catch((err) => console.error('Email send error:', err));
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const { orderIds, productIds, productId, orderId } = session.metadata ?? {};

    try {
      await connectDB();

      if (orderIds && productIds) {
        // ── Cart checkout (multiple items) ──
        const orderIdList = orderIds.split(',').filter(Boolean);
        const productIdList = productIds.split(',').filter(Boolean);

        await Promise.all(
          orderIdList.map((oid: string, i: number) =>
            completeOrder(oid, productIdList[i], session.payment_intent)
          )
        );
      } else if (orderId && productId) {
        // ── Single item checkout (legacy) ──
        await completeOrder(orderId, productId, session.payment_intent);
      }
    } catch (err) {
      console.error('Webhook handler error:', err);
    }
  }

  return NextResponse.json({ received: true });
}
