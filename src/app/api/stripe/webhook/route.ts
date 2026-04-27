import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import { completeOrder } from '@/lib/orderCompletion';

export const runtime = 'nodejs';

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

      if (orderIds) {
        // ── Cart checkout (multiple orders) ──
        const orderIdList: string[] = orderIds.split(',').filter(Boolean);
        // Store paymentIntentId on all orders then complete each
        await Order.updateMany(
          { _id: { $in: orderIdList } },
          { stripePaymentIntentId: session.payment_intent }
        );
        await Promise.all(orderIdList.map((oid) => completeOrder(oid)));
      } else if (orderId) {
        // ── Single item checkout (legacy) ──
        await Order.findByIdAndUpdate(orderId, { stripePaymentIntentId: session.payment_intent });
        await completeOrder(orderId);
      }
    } catch (err) {
      console.error('Stripe webhook handler error:', err);
    }
  }

  return NextResponse.json({ received: true });
}
