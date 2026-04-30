import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import { completeOrder, releaseReservedAccounts } from '@/lib/orderCompletion';

// ── Admin-only auth guard ─────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') return null;
  return session;
}

// ── GET /api/admin/orders/[id] — full order detail ───────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectDB();
    const order = await Order.findById(params.id)
      .populate('productId', 'game title images price productType')
      .lean();
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

// ── PATCH /api/admin/orders/[id] — approve or reject ─────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action } = await req.json(); // action: 'approve' | 'reject'

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
  }

  try {
    await connectDB();

    const order = await Order.findById(params.id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (action === 'approve') {
      // completeOrder handles delivery + marks status = completed
      await completeOrder(params.id);
      return NextResponse.json({ success: true, status: 'completed' });
    } else {
      // Reject — release any reserved accounts back to available pool
      if (order.productId) {
        await releaseReservedAccounts(String(order.productId), String(order._id));
      }
      await Order.findByIdAndUpdate(params.id, { status: 'rejected' });
      return NextResponse.json({ success: true, status: 'rejected' });
    }
  } catch (err: any) {
    console.error('admin order action error:', err);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
