'use client';
import { useCurrency } from '@/lib/currency';

interface Props {
  price: number;
  originalPrice?: number;
}

/** Renders a converted + formatted price pair in the user's selected currency. */
export function ProductPrice({ price, originalPrice }: Props) {
  const { formatPrice } = useCurrency();

  return (
    <div className="flex items-baseline gap-3 mb-5">
      <span className="text-4xl font-black text-white">{formatPrice(price)}</span>
      {originalPrice && originalPrice > price && (
        <span className="text-gray-600 text-xl line-through">{formatPrice(originalPrice)}</span>
      )}
    </div>
  );
}
