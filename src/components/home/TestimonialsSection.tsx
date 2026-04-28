'use client';
import { useRef, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { ROW_1, ROW_2, type Testimonial } from '@/data/testimonials';

// ── Star display (fractional, display-only) ──────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const pct = Math.min(1, Math.max(0, rating - (star - 1)));
        return (
          <svg key={star} className="w-3 h-3" viewBox="0 0 20 20">
            <defs>
              {pct > 0 && pct < 1 && (
                <linearGradient id={`sg-${star}-${rating}`} x1="0" x2="1">
                  <stop offset={`${pct * 100}%`} stopColor="#fbbf24" />
                  <stop offset={`${pct * 100}%`} stopColor="#374151" />
                </linearGradient>
              )}
            </defs>
            <path
              fill={pct === 1 ? '#fbbf24' : pct === 0 ? '#374151' : `url(#sg-${star}-${rating})`}
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        );
      })}
    </div>
  );
}

// ── Individual card ──────────────────────────────────────────────────────────
function Card({ item }: { item: Testimonial }) {
  return (
    <div
      className="flex-shrink-0 w-72 bg-gray-900 border border-gray-800 rounded-xl p-4 mx-2 select-none"
      style={{ userSelect: 'none' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none flex-shrink-0" aria-hidden>{item.flag}</span>
          <span className="text-gray-300 text-xs font-semibold truncate">{item.username}</span>
        </div>
        <div className="flex-shrink-0 ml-2">
          <Stars rating={item.rating} />
        </div>
      </div>
      {item.game && (
        <p className="text-violet-400 text-[10px] font-medium uppercase tracking-wider mb-1.5">{item.game}</p>
      )}
      <p
        className="text-gray-400 text-xs leading-relaxed overflow-hidden"
        style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {item.text}
      </p>
      <p className="text-gray-700 text-[10px] mt-2 font-medium">{item.rating.toFixed(1)} ★</p>
    </div>
  );
}

// ── Draggable infinite scroll track ─────────────────────────────────────────
interface TrackProps {
  items: Testimonial[];
  direction: 'left' | 'right';
  /** Auto-scroll speed in px per second */
  pxPerSec: number;
}

function ScrollTrack({ items, direction, pxPerSec }: TrackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef     = useRef<HTMLDivElement>(null);

  // All animation state in refs — never causes re-renders
  const pos  = useRef(0);       // current translateX in px
  const raf  = useRef<number>();
  const halfW = useRef(0);

  const drag = useRef({
    active:   false,
    startX:   0,
    startPos: 0,
    lastX:    0,
    lastT:    0,
    velocity: 0,   // px / second (positive = rightward)
  });

  // +1 for right-scroll auto direction, -1 for left
  const autoDir = direction === 'left' ? -1 : 1;

  // ── Main animation loop ──────────────────────────────────────────────────
  useEffect(() => {
    const track = containerRef.current?.querySelector<HTMLDivElement>('[data-track]');
    if (!track) return;

    const init = () => {
      halfW.current = track.scrollWidth / 2;
      if (direction === 'right') pos.current = -halfW.current;
      track.style.visibility = 'visible';
    };

    // Re-measure on resize (e.g. font load, window resize)
    const ro = new ResizeObserver(init);
    ro.observe(track);
    init();

    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50); // clamp to avoid huge jumps after tab switch
      last = now;

      if (!drag.current.active) {
        // Auto-scroll
        pos.current += autoDir * pxPerSec * (dt / 1000);

        // Momentum decay after drag release
        if (Math.abs(drag.current.velocity) > 2) {
          pos.current += drag.current.velocity * (dt / 1000);
          // Friction: ~0.92 per 16ms frame
          drag.current.velocity *= Math.pow(0.92, dt / 16.67);
        } else {
          drag.current.velocity = 0;
        }
      }

      // Wrap position to keep within [-halfW, 0)
      const hw = halfW.current;
      if (hw > 0) {
        if (pos.current < -hw) pos.current += hw;
        if (pos.current > 0)   pos.current -= hw;
      }

      track.style.transform = `translateX(${pos.current}px)`;
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [autoDir, pxPerSec, direction]);

  // ── Drag helpers ─────────────────────────────────────────────────────────
  const startDrag = useCallback((clientX: number) => {
    drag.current = {
      active:   true,
      startX:   clientX,
      startPos: pos.current,
      lastX:    clientX,
      lastT:    performance.now(),
      velocity: 0,
    };
  }, []);

  const moveDrag = useCallback((clientX: number) => {
    if (!drag.current.active) return;
    pos.current = drag.current.startPos + (clientX - drag.current.startX);

    const now = performance.now();
    const dt  = now - drag.current.lastT;
    if (dt > 0) {
      drag.current.velocity = ((clientX - drag.current.lastX) / dt) * 1000;
    }
    drag.current.lastX = clientX;
    drag.current.lastT = now;
  }, []);

  const endDrag = useCallback(() => {
    drag.current.active = false;
    // velocity persists → decays in tick loop (momentum / inertia)
  }, []);

  // ── Non-passive touchmove (needed to call e.preventDefault) ──────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTM = (e: TouchEvent) => {
      if (drag.current.active) {
        e.preventDefault();
        moveDrag(e.touches[0].clientX);
      }
    };
    el.addEventListener('touchmove', onTM, { passive: false });
    return () => el.removeEventListener('touchmove', onTM);
  }, [moveDrag]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX); }}
      onMouseMove={(e) => moveDrag(e.clientX)}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchStart={(e) => startDrag(e.touches[0].clientX)}
      onTouchEnd={endDrag}
      onTouchCancel={endDrag}
    >
      {/* visibility:hidden until JS sets the initial position to prevent flash */}
      <div
        data-track
        ref={trackRef}
        className="flex will-change-transform"
        style={{ visibility: 'hidden' }}
      >
        {/* Duplicate items for seamless infinite loop */}
        {[...items, ...items].map((item, idx) => (
          <Card key={`${item.id}-${idx}`} item={item} />
        ))}
      </div>
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────
export function TestimonialsSection() {
  const { t } = useI18n();

  return (
    <section className="py-20 bg-gray-950 overflow-hidden">
      {/* Heading */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
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

      {/* Row 1 — scrolls left at 160 px/s */}
      <div className="mb-4">
        <ScrollTrack items={ROW_1} direction="left"  pxPerSec={160} />
      </div>

      {/* Row 2 — scrolls right at 140 px/s */}
      <ScrollTrack items={ROW_2} direction="right" pxPerSec={140} />
    </section>
  );
}
