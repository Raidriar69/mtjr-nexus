import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { completeOrder } from '@/lib/orderCompletion';

const ADMIN_COUPON = 'adminfree';

export async function POST(req: NextRequest) {
  // ── 1. Auth: must be a logged-in admin ──────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
  if ((session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Admin access only' }, { status: 403 });
  }

  const { coupon, productIds, quantities, buyerEmail } = await req.json();

  // ── 2. Validate coupon (case-insensitive) ────────────────────────────────────
  if (!coupon || coupon.trim().toLowerCase() !== ADMIN_COUPON) {
    return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
  }

  if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: 'No products specified' }, { status: 400 });
  }

  await connectDB();

  const userId = (session.user as any).id as string | undefined;

  // ── 3. Validate products ─────────────────────────────────────────────────────
  for (let i = 0; i < productIds.length; i++) {
    const product = await Product.findById(productIds[i]).lean() as any;
    if (!product) {
      return NextResponse.json({ error: `Product not found: ${productIds[i]}` }, { status: 404 });
    }
    if (product.isSold) {
      return NextResponse.json({ error: `"${product.title}" is already sold` }, { status: 409 });
    }
  }

  // ── 4. Create orders at $0 and immediately complete them ────────────────────
  const orderIds: string[] = [];

  for (let i = 0; i < productIds.length; i++) {
    const qty = quantities?.[i] ?? 1;

    const order = await Order.create({
      userId,
      buyerEmail: buyerEmail.trim(),
      productId: productIds[i],
      amount: 0,   // FREE — admin test
      currency: 'usd',
      status: 'pending',
      paymentMethod: 'stripe', // neutral placeholder — completeOrder doesn't care
      quantity: qty,
    });

    const newId = String(order._id);
    orderIds.push(newId);

    // Deliver credentials immediately (same path as Stripe/PayPal webhook)
    await completeOrder(newId);
  }

  return NextResponse.json({ success: true, orderIds, primaryOrderId: orderIds[0] });
}
