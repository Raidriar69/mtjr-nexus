'use client';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { Product } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  product: Product;
}

export function ProductActions({ product }: Props) {
  const router = useRouter();
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(product._id);

  if (product.isSold) {
    return (
      <div className="w-full bg-gray-800/60 border border-gray-700 rounded-xl py-4 text-center text-gray-500 font-semibold text-lg">
        Account Sold
      </div>
    );
  }

  function handleAddToCart() {
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
    }
  }

  function handleBuyNow() {
    addItem({
      _id: product._id,
      title: product.title,
      game: product.game,
      price: product.price,
      originalPrice: product.originalPrice,
      images: product.images,
      platform: product.platform,
      rank: product.rank,
    });
    router.push('/checkout');
  }

  return (
    <div className="space-y-3">
      {/* Buy Now — primary CTA */}
      <button
        onClick={handleBuyNow}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl text-lg transition-all duration-200 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] active:scale-[0.98]"
      >
        Buy Now — ${product.price.toFixed(2)}
      </button>

      {/* Add to Cart — secondary */}
      <button
        onClick={handleAddToCart}
        className={`w-full font-semibold py-3 rounded-xl text-sm transition-all border ${
          inCart
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-violet-500/50 hover:text-white'
        }`}
      >
        {inCart ? '✓ Added to Cart' : '+ Add to Cart'}
      </button>
    </div>
  );
}
