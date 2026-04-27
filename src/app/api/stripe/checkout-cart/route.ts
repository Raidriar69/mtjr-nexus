import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';

export async function POST(request: NextRequest) {
  try {
    const { productIds, quantities: rawQty, buyerEmail } = await request.json();

    if (!productIds?.length) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 });
    }
    if (!buyerEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Default quantity to 1 for every item if not provided
    const quantities: number[] = productIds.map((_: string, i: number) =>
      Math.max(1, Number(rawQty?.[i]) || 1)
    );

    await connectDB();

    const session = await getServerSession(authOptions);
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Fetch + validate all products
    const products = await Promise.all(productIds.map((id: string) => Product.findById(id)));

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p) {
        return NextResponse.json({ error: `Product ${productIds[i]} not found` }, { status: 404 });
      }
      if (p.productType === 'bulk') {
        const stockCount = ((p.accounts ?? []) as any[]).filter((a: any) => !a.sold).length;
        if (stockCount < quantities[i]) {
          return NextResponse.json(
            { error: `"${p.title}" only has ${stockCount} account(s) in stock (requested ${quantities[i]})` },
            { status: 409 }
          );
        }
      } else if (p.isSold) {
        return NextResponse.json(
          { error: `"${p.title}" has already been sold`, soldId: p._id.toString() },
          { status: 409 }
        );
      }
    }

    // Create one pending Order per product (quantity stored on order)
    const orders = await Promise.all(
      products.map((p, i) =>
        Order.create({
          userId: (session?.user as any)?.id,
          buyerEmail,
          productId: p._id,
          amount: formatAmountForStripe(p.price) * quantities[i],
          currency: 'usd',
          status: 'pending',
          paymentMethod: 'stripe',
          quantity: quantities[i],
        })
      )
    );

    const orderIds = orders.map((o) => o._id.toString()).join(',');
    const pIds = productIds.join(',');

    // Build Stripe line items (per-unit price × quantity)
    const lineItems = products.map((p, i) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: p.title,
          description: `${p.game}${p.rank ? ' · ' + p.rank : ''}`,
          images: p.images?.length > 0 ? [p.images[0]] : [],
        },
        unit_amount: formatAmountForStripe(p.price),
      },
      quantity: quantities[i],
    }));

    const stripeSession = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      customer_email: buyerEmail,
      success_url: `${origin}/checkout/success?order_id=${orders[0]._id}&all_ids=${orderIds}`,
      cancel_url: `${origin}/cart?cancelled=true`,
      metadata: {
        orderIds,
        productIds: pIds,
      },
      custom_text: {
        submit: { message: 'Account credentials delivered instantly after payment.' },
      },
    });

    // Store stripe session ID on all orders
    await Promise.all(
      orders.map((o) => Order.findByIdAndUpdate(o._id, { stripeSessionId: stripeSession.id }))
    );

    return NextResponse.json({ url: stripeSession.url });
  } catch (error: any) {
    console.error('Cart checkout error:', error);
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
  }
}
