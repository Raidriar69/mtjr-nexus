'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, itemCount } = useCart();
  const [soldIds, setSoldIds] = useState<Set<string>>(new Set());
  const [validating, setValidating] = useState(false);

  // Check cart items are still available
  useEffect(() => {
    if (items.length === 0) return;
    setValidating(true);
    Promise.all(
      items.map((item) =>
        fetch(`/api/products/${item._id}`)
          .then((r) => r.json())
          .then((d) => ({ id: item._id, isSold: d.product?.isSold ?? false }))
          .catch(() => ({ id: item._id, isSold: false }))
      )
    ).then((results) => {
      setSoldIds(new Set(results.filter((r) => r.isSold).map((r) => r.id)));
      setValidating(false);
    });
  }, []); // eslint-disable-line

  const availableItems = items.filter((i) => !soldIds.has(i._id));
  const soldItems = items.filter((i) => soldIds.has(i._id));
  const total = availableItems.reduce((s, i) => s + i.price * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 pt-20 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-9 h-9 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-8 text-sm">Browse our catalog and add accounts you want.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3 rounded-xl transition-all hover:shadow-[0_0_25px_rgba(139,92,246,0.4)]"
          >
            Browse Accounts
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Cart</h1>
            <p className="text-gray-500 mt-1 text-sm">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── Item list ── */}
          <div className="lg:col-span-2 space-y-3">

            {soldItems.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-2">
                <p className="text-red-400 text-sm font-medium">
                  ⚠️ {soldItems.length} item{soldItems.length > 1 ? 's' : ''} in your cart {soldItems.length > 1 ? 'were' : 'was'} sold by someone else and will be removed at checkout.
                </p>
              </div>
            )}

            {items.map((item) => {
              const sold = soldIds.has(item._id);
              return (
                <div
                  key={item._id}
                  className={`bg-gray-900 border rounded-xl p-4 flex gap-4 transition-all ${
                    sold ? 'border-red-500/20 opacity-50' : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider">{item.game}</p>
                    <p className="text-white font-semibold text-sm mt-0.5 truncate">{item.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {item.rank && <span className="text-amber-400 text-xs">🏆 {item.rank}</span>}
                      {item.platform && <span className="text-gray-600 text-xs">{item.platform}</span>}
                      {sold && <span className="text-red-400 text-xs font-medium">● Sold</span>}
                    </div>
                    {/* Quantity controls for bulk items */}
                    {item.productType === 'bulk' && !sold && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 rounded bg-gray-800 border border-gray-700 text-white text-sm flex items-center justify-center disabled:opacity-40 hover:bg-gray-700 transition-colors"
                        >−</button>
                        <span className="text-white text-xs font-medium w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          disabled={item.quantity >= (item.availableStock ?? Infinity)}
                          className="w-6 h-6 rounded bg-gray-800 border border-gray-700 text-white text-sm flex items-center justify-center disabled:opacity-40 hover:bg-gray-700 transition-colors"
                        >+</button>
                        <span className="text-gray-600 text-xs">×{item.quantity}</span>
                      </div>
                    )}
                  </div>

                  {/* Price + remove */}
                  <div className="flex flex-col items-end justify-between flex-shrink-0">
                    <div className="text-right">
                      <span className="text-white font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</span>
                      {item.quantity > 1 && (
                        <p className="text-gray-600 text-xs">${item.price.toFixed(2)} each</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item._id)}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}

            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors pt-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Continue Shopping
            </Link>
          </div>

          {/* ── Order Summary ── */}
          <div className="sticky top-24">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-5">Order Summary</h2>

              <div className="space-y-2.5 mb-5">
                {availableItems.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-gray-400 truncate mr-3 max-w-[160px]">
                      {item.title}
                      {item.quantity > 1 && <span className="text-gray-600"> ×{item.quantity}</span>}
                    </span>
                    <span className="text-white font-medium flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {soldItems.length > 0 && (
                  <p className="text-red-400 text-xs pt-1">
                    {soldItems.length} sold item{soldItems.length > 1 ? 's' : ''} excluded
                  </p>
                )}
              </div>

              <div className="border-t border-gray-800 pt-4 mb-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-400">Total</span>
                  <span className="text-white font-black text-2xl">${total.toFixed(2)}</span>
                </div>
                <p className="text-gray-600 text-xs mt-1">USD · Instant delivery after payment</p>
              </div>

              {availableItems.length > 0 ? (
                <button
                  onClick={() => router.push('/checkout')}
                  disabled={validating}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2"
                >
                  {validating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Checking availability...
                    </>
                  ) : (
                    <>
                      Proceed to Checkout
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-gray-800/60 rounded-xl p-4 text-center">
                  <p className="text-gray-500 text-sm">All items are unavailable. Browse for more accounts.</p>
                  <Link href="/products" className="text-violet-400 hover:text-violet-300 text-sm mt-2 block">Browse →</Link>
                </div>
              )}

              <div className="mt-5 space-y-2">
                {[
                  { icon: '✓', text: 'Instant digital delivery', color: 'text-emerald-500' },
                  { icon: '🔒', text: 'Card, PayPal & Crypto accepted', color: 'text-gray-500' },
                  { icon: '⚡', text: 'Account credentials delivered by email', color: 'text-gray-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className={item.color}>{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
