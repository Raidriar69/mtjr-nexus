import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/login');
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/products', label: 'Products', icon: '🎮' },
    { href: '/admin/products/new', label: 'Add Product', icon: '➕' },
    { href: '/admin/orders', label: 'Orders', icon: '📦' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-56 flex-shrink-0">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sticky top-24">
              <p className="text-amber-400 font-bold text-sm mb-4 px-2 flex items-center gap-1.5">
                ⚡ Admin Panel
              </p>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                <div className="pt-2 mt-2 border-t border-gray-800">
                  <Link
                    href="/"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    <span>🏠</span>
                    Back to Site
                  </Link>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
