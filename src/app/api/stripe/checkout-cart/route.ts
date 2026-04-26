import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';

export async function POST(request: NextRequest) {
  try {
    const { productIds, buyerEmail } = await request.json();

    if (!productIds?.length) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 });
    }
    if (!buyerEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    const session = await getServerSession(authOptions);
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Fetch + validate all products
    const products = await Promise.all(
      productIds.map((id: string) => Product.findById(id))
    );

    const notFound = products.findIndex((p) => !p);
    if (notFound !== -1) {
      return NextResponse.json({ error: `Product ${productIds[notFound]} not found` }, { status: 404 });
    }

    const alreadySold = products.find((p) => p.isSold);
    if (alreadySold) {
      return NextResponse.json(
        { error: `"${alreadySold.title}" has already been sold`, soldId: alreadySold._id.toString() },
        { status: 409 }
      );
    }

    // Create one pending Order per product
    const orders = await Promise.all(
      products.map((p) =>
        Order.create({
          userId: (session?.user as any)?.id,
          buyerEmail,
          productId: p._id,
          amount: formatAmountForStripe(p.price),
          currency: 'usd',
          status: 'pending',
          paymentMethod: 'stripe',
        })
      )
    );

    const orderIds = orders.map((o) => o._id.toString()).join(',');
    const pIds = productIds.join(',');
    const totalAmount = products.reduce((s: number, p: any) => s + formatAmountForStripe(p.price), 0);

    // Build Stripe line items
    const lineItems = products.map((p) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: p.title,
          description: `${p.game}${p.rank ? ' · ' + p.rank : ''}`,
          images: p.images?.length > 0 ? [p.images[0]] : [],
        },
        unit_amount: formatAmountForStripe(p.price),
      },
      quantity: 1,
    }));

    const stripeSession = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      customer_email: buyerEmail,
      success_url: `${origin}/checkout/success?order_id=${orders[0]._id}&all_ids=${orderIds}`,
      cancel_url: `${origin}/cart?cancelled=true`,
      metadata: {
        orderIds,           // comma-separated order IDs
        productIds: pIds,   // comma-separated product IDs
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
