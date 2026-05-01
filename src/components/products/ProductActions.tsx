'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { useCurrency } from '@/lib/currency';
import { Product } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  product: Product;
}

export function ProductActions({ product }: Props) {
  const router = useRouter();
  const { addItem, isInCart, updateQuantity, items } = useCart();
  const { formatPrice } = useCurrency();
  const inCart = isInCart(product._id);

  const isBulk = product.productType === 'bulk';
  const availableStock = product.availableStock ?? 0;
  const maxQty = isBulk ? availableStock : 1;

  // Sync initial qty with what's already in cart (if bulk)
  const cartItem = items.find((i) => i._id === product._id);
  const [qty, setQty] = useState<number>(cartItem?.quantity ?? 1);

  function changeQty(delta: number) {
    const newQty = Math.max(1, Math.min(qty + delta, maxQty));
    setQty(newQty);
    if (inCart) updateQuantity(product._id, newQty);
  }

  // Sold-out logic
  const isOutOfStock = isBulk ? availableStock === 0 : product.isSold;

  if (isOutOfStock) {
    return (
      <div className="space-y-3">
        <div className="w-full bg-gray-800/60 border border-gray-700 rounded-xl py-4 text-center text-gray-500 font-semibold text-lg">
          {isBulk ? 'Out of Stock' : 'Account Sold'}
        </div>
        {isBulk && (
          <p className="text-center text-gray-600 text-xs">Check back later — new stock added regularly</p>
        )}
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
      productType: product.productType,
      availableStock: product.availableStock,
      quantity: qty,
    });

    if (result === 'added') {
      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <span>{isBulk && qty > 1 ? `${qty}× added to cart!` : 'Added to cart!'}</span>
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
    } else if (result === 'max_stock') {
      toast(`Max stock (${availableStock}) already in cart.`, { icon: '⚠️' });
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
      productType: product.productType,
      availableStock: product.availableStock,
      quantity: qty,
    });
    router.push('/checkout');
  }

  return (
    <div className="space-y-3">
      {/* Quantity selector — bulk only */}
      {isBulk && (
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm font-medium">Quantity</span>
            <span className="text-emerald-400 text-xs font-semibold">
              {availableStock} in stock
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeQty(-1)}
              disabled={qty <= 1}
              className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 text-white font-bold text-lg flex items-center justify-center disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              −
            </button>
            <span className="flex-1 text-center text-white font-bold text-xl">{qty}</span>
            <button
              onClick={() => changeQty(1)}
              disabled={qty >= maxQty}
              className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 text-white font-bold text-lg flex items-center justify-center disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              +
            </button>
          </div>
          {qty > 1 && (
            <p className="text-gray-500 text-xs mt-2 text-center">
              Total: {formatPrice(product.price * qty)}
            </p>
          )}
        </div>
      )}

      {/* Buy Now — primary CTA */}
      <button
        onClick={handleBuyNow}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl text-lg transition-all duration-200 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] active:scale-[0.98]"
      >
        Buy Now — {formatPrice(product.price * (isBulk ? qty : 1))}
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
        {inCart ? `✓ In Cart${isBulk && cartItem ? ` (×${cartItem.quantity})` : ''}` : '+ Add to Cart'}
      </button>
    </div>
  );
}
