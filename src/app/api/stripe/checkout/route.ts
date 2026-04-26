import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';

export async function POST(request: NextRequest) {
  try {
    const { productId, buyerEmail } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (product.isSold) {
      return NextResponse.json({ error: 'This account has already been sold' }, { status: 409 });
    }

    const session = await getServerSession(authOptions);
    const email = buyerEmail || session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: 'Email is required for checkout' }, { status: 400 });
    }

    const origin =
      request.headers.get('origin') ||
      process.env.NEXTAUTH_URL ||
      'http://localhost:3000';

    const order = await Order.create({
      userId: (session?.user as any)?.id,
      buyerEmail: email,
      productId: product._id,
      amount: formatAmountForStripe(product.price),
      currency: 'usd',
      status: 'pending',
      paymentMethod: 'stripe',
    });

    const stripeSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.title,
              description: `${product.game}${product.rank ? ' · ' + product.rank : ''}`,
              images: product.images.length > 0 ? [product.images[0]] : [],
            },
            unit_amount: formatAmountForStripe(product.price),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email,
      success_url: `${origin}/checkout/success?order_id=${order._id}`,
      cancel_url: `${origin}/products/${productId}?cancelled=true`,
      metadata: {
        productId: productId.toString(),
        orderId: order._id.toString(),
      },
      // Custom appearance for gaming vibe
      custom_text: {
        submit: { message: 'Your account credentials will be delivered instantly after payment.' },
      },
    });

    await Order.findByIdAndUpdate(order._id, { stripeSessionId: stripeSession.id });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
  }
}
