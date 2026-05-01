'use client';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { useCurrency } from '@/lib/currency';
import { Product } from '@/types';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem, isInCart } = useCart();
  const { formatPrice } = useCurrency();

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const inCart = isInCart(product._id);

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    if (product.isSold) return;

    const result = addItem({
      _id: product._id,
      title: product.title,
      game: product.game,
      price: product.price,
      originalPrice: product.originalPrice,
      images: product.images,
      platform: product.platform,
      rank: product.rank,
    });

    if (result === 'added') {
      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <span>Added to cart!</span>
            <button
              onClick={() => { toast.dismiss(t.id); router.push('/cart'); }}
              className="text-violet-400 font-semibold text-xs hover:text-violet-300 whitespace-nowrap"
            >
              Go to Cart →
            </button>
          </div>
        ),
        { duration: 3500 }
      );
    } else if (result === 'already_in_cart') {
      toast('Already in your cart.', { icon: '🛒' });
    } else {
      toast.error('Cart is full (max 10 items).');
    }
  }

  return (
    <div
      onClick={() => router.push(`/products/${product._id}`)}
      className={`
        group relative bg-gray-900/80 border rounded-xl overflow-hidden flex flex-col
        transition-all duration-300 cursor-pointer select-none
        ${product.isSold
          ? 'border-gray-800 opacity-70'
          : 'border-gray-800 hover:border-violet-500/70 hover:-translate-y-1.5 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.45),0_8px_40px_rgba(139,92,246,0.18)]'
        }
      `}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-gray-800 overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-950/40 via-gray-900 to-cyan-950/20">
            <svg className="w-14 h-14 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
        )}

        {product.isSold && (
          <div className="absolute inset-0 bg-gray-950/75 flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-gray-800 border border-gray-600 text-gray-300 font-bold text-sm px-4 py-1.5 rounded-full tracking-widest uppercase">
              Sold
            </span>
          </div>
        )}

        {!product.isSold && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-violet-600/15 via-transparent to-transparent" />
        )}

        <div className="absolute top-2 left-2 flex gap-1.5">
          {product.isFeatured && !product.isSold && <Badge variant="warning">⭐ Featured</Badge>}
        </div>
        {discount && !product.isSold && (
          <div className="absolute top-2 right-2">
            <Badge variant="danger">-{discount}%</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-1">{product.game}</p>
        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem] flex-1">{product.title}</h3>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {product.rank && (
            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2 py-0.5 rounded-full">
              🏆 {product.rank}
            </span>
          )}
          {product.platform && (
            <span className="bg-gray-800 text-gray-400 border border-gray-700 text-xs px-2 py-0.5 rounded-full">{product.platform}</span>
          )}
          {product.skins && product.skins.length > 0 && (
            <span className="bg-gray-800 text-gray-400 border border-gray-700 text-xs px-2 py-0.5 rounded-full">{product.skins.length} skins</span>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-white font-bold text-xl">{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-gray-600 text-sm line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>

          {product.isSold ? (
            <div className="w-full bg-gray-800/60 text-gray-600 text-sm font-medium py-2.5 rounded-lg text-center">
              Sold Out
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                inCart
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-violet-600/20 border border-violet-500/30 text-violet-400 hover:bg-violet-600 hover:text-white hover:border-violet-600 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              }`}
            >
              {inCart ? '✓ In Cart' : '+ Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
