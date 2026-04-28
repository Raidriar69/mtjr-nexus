'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export function HeroSection() {
  const { t } = useI18n();

  const stats = [
    { value: '500+',   labelKey: 'home.statAccounts' as const },
    { value: '1,200+', labelKey: 'home.statBuyers'   as const },
    { value: '< 5min', labelKey: 'home.statDelivery' as const },
    { value: '4.9★',   labelKey: 'home.statRating'   as const },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,58,237,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.15) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-violet-300 text-sm font-medium">{t('home.heroBadge')}</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight">
          {t('home.heroTitle1')}{' '}
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {t('home.heroTitle2')}
          </span>
          <br />
          {t('home.heroTitle3')}
        </h1>

        <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('home.heroDesc')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-lg transition-all duration-200 shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)]"
          >
            {t('home.browseAccounts')}
          </Link>
          <Link
            href="/products?featured=true"
            className="inline-flex items-center justify-center px-8 py-4 bg-transparent border border-gray-700 hover:border-violet-500/50 text-gray-300 hover:text-white font-bold rounded-xl text-lg transition-all duration-200"
          >
            {t('home.viewFeatured')}
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
          {stats.map((stat) => (
            <div key={stat.labelKey} className="text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-gray-500 text-sm mt-0.5">{t(stat.labelKey)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600 animate-bounce">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
