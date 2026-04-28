'use client';
import { useI18n } from '@/lib/i18n';
import { ROW_1, ROW_2, type Testimonial } from '@/data/testimonials';

// ── Star renderer (display only, supports 0.5 increments) ────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled  = rating >= star;
        const partial = !filled && rating > star - 1;
        const fill    = filled ? '#fbbf24' : partial ? '#fbbf24' : '#374151';
        const opacity = partial ? Math.round((rating - (star - 1)) * 100) / 100 : 1;
        return (
          <svg key={star} className="w-3 h-3" viewBox="0 0 20 20">
            <path
              fill={fill}
              opacity={partial ? opacity : 1}
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        );
      })}
    </div>
  );
}

// ── Individual card ───────────────────────────────────────────────────────────
function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="flex-shrink-0 w-72 bg-gray-900 border border-gray-800 rounded-xl p-4 mx-2 hover:border-violet-500/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none flex-shrink-0">{t.flag}</span>
          <span className="text-gray-300 text-xs font-semibold truncate">{t.username}</span>
        </div>
        <div className="flex-shrink-0 ml-2">
          <Stars rating={t.rating} />
        </div>
      </div>
      {t.game && (
        <p className="text-violet-400 text-[10px] font-medium uppercase tracking-wider mb-1.5">{t.game}</p>
      )}
      <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{t.text}</p>
      <p className="text-gray-700 text-[10px] mt-2 font-medium">{t.rating.toFixed(1)} ★</p>
    </div>
  );
}

// ── Scrolling track (duplicates cards for seamless loop) ─────────────────────
function ScrollTrack({
  testimonials,
  direction,
  speed,
}: {
  testimonials: Testimonial[];
  direction: 'left' | 'right';
  speed: number;
}) {
  // Duplicate for seamless wrap
  const doubled = [...testimonials, ...testimonials];
  const animClass = direction === 'left' ? 'testimonials-scroll-left' : 'testimonials-scroll-right';

  return (
    <div className="overflow-hidden">
      <div
        className={`flex ${animClass} hover:[animation-play-state:paused]`}
        style={{ animationDuration: `${speed}s` }}
      >
        {doubled.map((item, idx) => (
          <TestimonialCard key={`${item.id}-${idx}`} t={item} />
        ))}
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export function TestimonialsSection() {
  const { t } = useI18n();

  return (
    <section className="py-20 bg-gray-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {t('home.testimonialsTitle')}{' '}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              {t('home.testimonialsSpan')}
            </span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">
            {t('home.testimonialsDesc')}
          </p>
        </div>
      </div>

      {/* Row 1 — scrolls left */}
      <div className="mb-4">
        <ScrollTrack testimonials={ROW_1} direction="left"  speed={70} />
      </div>

      {/* Row 2 — scrolls right */}
      <ScrollTrack testimonials={ROW_2} direction="right" speed={80} />
    </section>
  );
}
