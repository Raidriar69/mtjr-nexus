import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import User from '@/models/User';
import { DashboardStats } from '@/components/admin/DashboardStats';
import Link from 'next/link';

async function getStats() {
  try {
    await connectDB();
    const [totalProducts, soldProducts, completedOrders, totalUsers, revenueAgg, recentOrders] =
      await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ isSold: true }),
        Order.countDocuments({ status: 'completed' }),
        User.countDocuments(),
        Order.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Order.find({})
          .populate('productId', 'game title')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

    return {
      totalProducts,
      availableProducts: totalProducts - soldProducts,
      soldProducts,
      completedOrders,
      totalUsers,
      revenue: revenueAgg[0]?.total ?? 0,
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
    };
  } catch {
    return {
      totalProducts: 0,
      availableProducts: 0,
      soldProducts: 0,
      completedOrders: 0,
      totalUsers: 0,
      revenue: 0,
      recentOrders: [],
    };
  }
}

const statusColor = (s: string) =>
  s === 'completed' ? 'text-emerald-400' : s === 'pending' ? 'text-amber-400' : 'text-red-400';

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Store overview and recent activity</p>
      </div>

      <DashboardStats {...stats} />

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/products/new"
          className="bg-violet-600/10 border border-violet-500/30 rounded-xl p-5 hover:bg-violet-600/20 transition-colors group"
        >
          <div className="text-violet-400 text-2xl mb-2">➕</div>
          <h3 className="text-white font-semibold">Add New Product</h3>
          <p className="text-gray-500 text-sm mt-1">List a new gaming account</p>
        </Link>
        <Link
          href="/admin/orders"
          className="bg-cyan-600/10 border border-cyan-500/30 rounded-xl p-5 hover:bg-cyan-600/20 transition-colors"
        >
          <div className="text-cyan-400 text-2xl mb-2">📦</div>
          <h3 className="text-white font-semibold">View All Orders</h3>
          <p className="text-gray-500 text-sm mt-1">Manage customer purchases</p>
        </Link>
      </div>

      {/* Recent orders */}
      {stats.recentOrders.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-white font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-violet-400 hover:text-violet-300 text-sm transition-colors">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {stats.recentOrders.map((order: any) => (
              <div key={order._id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {(order.productId as any)?.title ?? 'Unknown Product'}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5 truncate">{order.buyerEmail}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white text-sm font-semibold">${(order.amount / 100).toFixed(2)}</p>
                  <p className={`text-xs mt-0.5 capitalize ${statusColor(order.status)}`}>{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
