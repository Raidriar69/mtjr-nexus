import { Suspense } from 'react';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { HeroSection } from '@/components/home/HeroSection';
import { CategorySection } from '@/components/home/CategorySection';
import { TrustSection } from '@/components/home/TrustSection';
import { ProductGrid } from '@/components/products/ProductGrid';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

async function getFeaturedProducts() {
  try {
    await connectDB();
    const products = await Product.find({ isSold: false, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch {
    return [];
  }
}

async function getLatestProducts() {
  try {
    await connectDB();
    const products = await Product.find({ isSold: false })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featured, latest] = await Promise.all([getFeaturedProducts(), getLatestProducts()]);

  return (
    <>
      <HeroSection />
      <CategorySection />

      {/* Featured */}
      {featured.length > 0 && (
        <section className="py-16 bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  ⭐ Featured{' '}
                  <span className="text-gradient">Accounts</span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">Hand-picked premium listings</p>
              </div>
              <Link
                href="/products?featured=true"
                className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
              >
                View all →
              </Link>
            </div>
            <Suspense fallback={<div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>}>
              <ProductGrid products={featured} />
            </Suspense>
          </div>
        </section>
      )}

      {/* Latest */}
      <section className="py-16 bg-[#0d0d15]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                🔥 Latest{' '}
                <span className="text-gradient">Listings</span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">Fresh accounts added recently</p>
            </div>
            <Link
              href="/products"
              className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
            >
              Browse all →
            </Link>
          </div>
          <Suspense fallback={<div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>}>
            <ProductGrid products={latest} emptyMessage="No accounts listed yet — check back soon." />
          </Suspense>
        </div>
      </section>

      <TrustSection />

      {/* CTA */}
      <section className="py-20 bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-violet-900/30 to-cyan-900/10 border border-violet-500/20 rounded-2xl p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to upgrade your account?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Browse hundreds of verified accounts and get instant delivery via email.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200 shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)]"
            >
              Shop Now →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
