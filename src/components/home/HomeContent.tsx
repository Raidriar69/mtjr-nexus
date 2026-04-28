'use client';
import Link from 'next/link';
import { Suspense } from 'react';
import { ProductGrid } from '@/components/products/ProductGrid';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useI18n } from '@/lib/i18n';
import type { Product } from '@/types';

interface Props {
  featured: Product[];
  latest: Product[];
}

export function HomeContent({ featured, latest }: Props) {
  const { t } = useI18n();

  return (
    <>
      {/* Featured */}
      {featured.length > 0 && (
        <section className="py-16 bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {t('home.featuredTitle')}{' '}
                  <span className="text-gradient">{t('home.featuredSpan')}</span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">{t('home.featuredDesc')}</p>
              </div>
              <Link
                href="/products?featured=true"
                className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
              >
                {t('home.viewAll')}
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
                {t('home.latestTitle')}{' '}
                <span className="text-gradient">{t('home.latestSpan')}</span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">{t('home.latestDesc')}</p>
            </div>
            <Link
              href="/products"
              className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
            >
              {t('home.browseAll')}
            </Link>
          </div>
          <Suspense fallback={<div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>}>
            <ProductGrid products={latest} emptyMessage={t('home.noAccounts')} />
          </Suspense>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-violet-900/30 to-cyan-900/10 border border-violet-500/20 rounded-2xl p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t('home.ctaTitle')}
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              {t('home.ctaDesc')}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200 shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)]"
            >
              {t('home.shopNow')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
