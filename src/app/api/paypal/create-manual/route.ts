import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { generateVerificationCode, generateInvoiceId } from '@/lib/verificationCode';

export async function POST(req: NextRequest) {
  try {
    const { productIds, quantities, buyerEmail } = await req.json();

    if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'No products specified' }, { status: 400 });
    }

    await connectDB();

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    // Validate all products and calculate total
    let totalCents = 0;
    const productDetails: { id: string; title: string; game: string; price: number; qty: number; image?: string }[] = [];

    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i];
      const qty = quantities?.[i] ?? 1;
      const product = await Product.findById(productId).lean() as any;
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 });
      }
      if (product.isSold) {
        return NextResponse.json({ error: `Product "${product.title}" is already sold` }, { status: 409 });
      }
      // Bulk stock check: ensure enough available accounts for the requested qty
      if (product.productType === 'bulk') {
        const availableCount = (product.accounts ?? []).filter((a: any) => a.status === 'available').length;
        if (availableCount < qty) {
          return NextResponse.json(
            { error: `Only ${availableCount} account(s) available for "${product.title}", but ${qty} requested` },
            { status: 409 }
          );
        }
      }
      totalCents += Math.round(product.price * 100) * qty;
      productDetails.push({
        id: String(product._id),
        title: product.title,
        game: product.game,
        price: product.price,
        qty,
        image: product.images?.[0],
      });
    }

    // Generate unique identifiers
    const paypalInvoiceId = generateInvoiceId();
    const paypalVerificationCode = generateVerificationCode();

    // Create ONE order per product (matching existing pattern)
    const orderIds: string[] = [];
    for (const pd of productDetails) {
      const order = await Order.create({
        userId,
        buyerEmail: buyerEmail.trim(),
        productId: pd.id,
        amount: Math.round(pd.price * 100) * pd.qty,
        currency: 'usd',
        status: 'pending',
        paymentMethod: 'paypal_manual',
        quantity: pd.qty,
        paypalInvoiceId,
        paypalVerificationCode,
        paypalManual: true,
      });
      orderIds.push(String(order._id));
    }

    return NextResponse.json({
      success: true,
      orderIds,
      primaryOrderId: orderIds[0],
      paypalInvoiceId,
      paypalVerificationCode,
      totalCents,
      products: productDetails,
      buyerEmail: buyerEmail.trim(),
    });
  } catch (err: any) {
    console.error('create-manual error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
