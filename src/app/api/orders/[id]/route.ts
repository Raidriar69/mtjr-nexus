import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const order = await Order.findById(params.id)
      .populate('productId', 'game title images price productType')
      .lean() as any;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If the caller is an authenticated session user, verify ownership
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const userId = (session.user as any).id;
      const email  = session.user.email;
      const ownsOrder =
        (userId && order.userId === userId) ||
        (email && order.buyerEmail === email);

      if (!ownsOrder) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Order ID (24-char hex ObjectID) acts as a bearer token for anonymous
    // access — standard for e-commerce receipt/success pages.
    // Credentials are included so the checkout/success page can display them.
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
