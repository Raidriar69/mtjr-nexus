'use client';
import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  const sizeClass = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hover || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`${sizeClass} transition-colors ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'
            } ${filled ? 'text-amber-400' : 'text-gray-700'}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

/** Display-only compact star row with fractional support */
export function StarDisplay({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = value >= star;
          const partial = !filled && value > star - 1;
          return (
            <svg key={star} className="w-4 h-4" viewBox="0 0 20 20">
              <defs>
                {partial && (
                  <linearGradient id={`partial-${star}`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset={`${(value - (star - 1)) * 100}%`} stopColor="#fbbf24" />
                    <stop offset={`${(value - (star - 1)) * 100}%`} stopColor="#374151" />
                  </linearGradient>
                )}
              </defs>
              <path
                fill={filled ? '#fbbf24' : partial ? `url(#partial-${star})` : '#374151'}
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          );
        })}
      </div>
      <span className="text-amber-400 text-sm font-semibold">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-gray-500 text-xs">({count})</span>}
    </div>
  );
}
