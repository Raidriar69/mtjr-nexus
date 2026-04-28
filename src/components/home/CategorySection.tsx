'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export function CategorySection() {
  const { t } = useI18n();

  const categories = [
    { id: 'fortnite', name: 'Fortnite',      descKey: 'home.catFortniteDesc' as const, color: 'from-blue-600 to-purple-600',   emoji: '🎯' },
    { id: 'valorant', name: 'Valorant',      descKey: 'home.catValorantDesc' as const, color: 'from-red-600 to-pink-600',      emoji: '🔫' },
    { id: 'csgo',     name: 'CS2',           descKey: 'home.catCS2Desc'     as const, color: 'from-orange-500 to-yellow-500',  emoji: '💣' },
    { id: 'apex',     name: 'Apex Legends',  descKey: 'home.catApexDesc'    as const, color: 'from-red-500 to-orange-400',     emoji: '👑' },
    { id: 'cod',      name: 'Call of Duty',  descKey: 'home.catCODDesc'     as const, color: 'from-green-600 to-emerald-500',  emoji: '🎖️' },
    { id: 'steam',    name: 'Steam',         descKey: 'home.catSteamDesc'   as const, color: 'from-blue-700 to-cyan-600',      emoji: '🎮' },
  ];

  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {t('home.shopByGame')}{' '}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              {t('home.shopByGameSpan')}
            </span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            {t('home.categoriesDesc')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className="group relative bg-gray-900 border border-gray-800 rounded-xl p-5 text-center hover:border-violet-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(124,58,237,0.15)] overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className="text-3xl mb-3">{cat.emoji}</div>
              <div className="text-white font-semibold text-sm">{cat.name}</div>
              <div className="text-gray-500 text-xs mt-1 leading-tight hidden sm:block">{t(cat.descKey)}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
