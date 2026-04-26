import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectDB();
    const [totalProducts, soldProducts, totalOrders, completedOrders, totalUsers, revenueAgg] =
      await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ isSold: true }),
        Order.countDocuments(),
        Order.countDocuments({ status: 'completed' }),
        User.countDocuments(),
        Order.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

    const revenue = revenueAgg[0]?.total ?? 0;

    return NextResponse.json({
      totalProducts,
      availableProducts: totalProducts - soldProducts,
      soldProducts,
      totalOrders,
      completedOrders,
      totalUsers,
      revenue,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
