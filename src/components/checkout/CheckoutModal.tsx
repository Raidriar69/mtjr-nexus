'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Product } from '@/types';

type CryptoCoin = 'BTC' | 'ETH' | 'SOL' | 'LTC';
type Method = 'paypal' | CryptoCoin;

const COINS: CryptoCoin[] = ['BTC', 'ETH', 'SOL', 'LTC'];
const COIN_ICON: Record<CryptoCoin, string> = { BTC: '/icons/btc.png', ETH: '/icons/eth.png', SOL: '/icons/sol.png', LTC: '/icons/ltc.png' };
const COIN_ACCENT: Record<CryptoCoin, string> = {
  BTC: 'border-orange-500/60 bg-orange-500/10 text-orange-400',
  ETH: 'border-blue-500/60   bg-blue-500/10   text-blue-400',
  SOL: 'border-purple-500/60 bg-purple-500/10 text-purple-400',
  LTC: 'border-gray-400/50   bg-gray-400/10   text-gray-300',
};

interface Props { product: Product; }

export function CheckoutModal({ product }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [method, setMethod]   = useState<Method>('paypal');
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.email) setEmail(session.user.email);
  }, [session]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (product.isSold) {
    return (
      <div className="w-full bg-gray-800/60 border border-gray-700 rounded-xl py-4 text-center text-gray-500 font-semibold text-lg">
        Account Sold
      </div>
    );
  }

  function validateEmail(): boolean {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Enter a valid email address');
      return false;
    }
    return true;
  }

  async function handleProceed() {
    if (!validateEmail()) return;
    setLoading(true);

    try {
      const productIds = [product._id];
      const quantities = [1];
      const buyerEmail = email.trim();

      if (method === 'paypal') {
        const res = await fetch('/api/paypal/create-manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds, quantities, buyerEmail }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create order');

        const params = new URLSearchParams({
          order_ids:  data.orderIds.join(','),
          invoice_id: data.paypalInvoiceId,
          code:       data.paypalVerificationCode,
          total:      String(data.totalCents),
          products:   encodeURIComponent(JSON.stringify(data.products)),
        });
        router.push(`/checkout/paypal?${params.toString()}`);
      } else {
        const res = await fetch('/api/crypto/create-manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds, quantities, buyerEmail, coin: method }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create order');

        const params = new URLSearchParams({
          order_ids:     data.orderIds.join(','),
          invoice_id:    data.cryptoInvoiceId,
          coin:          data.coin,
          crypto_amount: String(data.cryptoManualAmount),
          wallet:        data.walletAddress,
          total:         String(data.totalCents),
          products:      encodeURIComponent(JSON.stringify(data.products)),
        });
        router.push(`/checkout/crypto?${params.toString()}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
      setLoading(false);
    }
  }

  const isPayPal   = method === 'paypal';
  const isCrypto   = !isPayPal;

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl text-lg transition-all duration-200 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] active:scale-[0.98]"
      >
        Buy Now — ${product.price.toFixed(2)}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { if (!loading) setOpen(false); }} />

          <div className="relative w-full sm:max-w-md bg-gray-900 border border-gray-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
            {/* Mobile handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-700 rounded-full" />
            </div>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="min-w-0 pr-4">
                  <h2 className="text-white text-xl font-bold">Checkout</h2>
                  <p className="text-gray-400 text-sm mt-0.5 truncate">{product.title}</p>
                </div>
                <button
                  onClick={() => { if (!loading) setOpen(false); }}
                  className="text-gray-500 hover:text-gray-300 transition-colors p-1 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Price summary */}
              <div className="bg-gray-800/80 border border-gray-700/50 rounded-xl p-4 mb-5 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">{product.game}</p>
                  <p className="text-gray-300 text-sm mt-0.5 max-w-[180px] truncate">{product.title}</p>
                </div>
                <p className="text-white font-black text-2xl flex-shrink-0">${product.price.toFixed(2)}</p>
              </div>

              {/* Email */}
              <div className="mb-5">
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">
                  Email for order receipt &amp; credentials
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!session?.user?.email}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Payment method selector */}
              <div className="mb-5">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">Payment Method</p>

                {/* PayPal option */}
                <button
                  onClick={() => setMethod('paypal')}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 mb-2 text-left transition-all ${
                    isPayPal
                      ? 'border-[#009cde]/50 bg-[#009cde]/8 text-[#009cde]'
                      : 'border-gray-800 bg-gray-800/30 hover:border-gray-700'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <img src="/icons/paypal-p.png" alt="PayPal" className="w-8 h-8 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${isPayPal ? '' : 'text-gray-300'}`}>PayPal</p>
                    <p className="text-gray-500 text-xs">Send to mkx399@gmail.com · 1–60 min</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isPayPal ? 'border-[#009cde]' : 'border-gray-600'}`}>
                    {isPayPal && <div className="w-2 h-2 rounded-full bg-[#009cde]" />}
                  </div>
                </button>

                {/* Crypto grid */}
                <div className="grid grid-cols-4 gap-2">
                  {COINS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setMethod(c)}
                      className={`py-3 px-1 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                        method === c ? COIN_ACCENT[c] : 'border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300'
                      }`}
                    >
                      <img src={COIN_ICON[c]} alt={c} className="w-6 h-6 object-contain" />
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info strip */}
              <div className={`rounded-xl p-3 mb-5 text-xs leading-relaxed ${
                isPayPal
                  ? 'bg-[#009cde]/5 border border-[#009cde]/20 text-[#009cde]/80'
                  : 'bg-amber-500/5 border border-amber-500/20 text-amber-400/80'
              }`}>
                {isPayPal
                  ? "You'll get a unique 4-word code. Send the exact amount to mkx399@gmail.com on PayPal with the code in the note. Approved within 1 hour."
                  : `You'll get the exact ${method} amount (unique per order) and wallet address. Send it on-chain, then click "Mark as Paid". Approved after on-chain verification.`
                }
              </div>

              {/* CTA */}
              <button
                onClick={handleProceed}
                disabled={loading}
                className={`w-full text-white font-black py-3.5 rounded-xl text-base transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isPayPal    ? 'bg-[#009cde] hover:bg-[#00b4f0] shadow-[0_0_20px_rgba(0,156,222,0.3)]' :
                  method === 'BTC' ? 'bg-orange-500 hover:bg-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]' :
                  method === 'ETH' ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' :
                  method === 'SOL' ? 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]' :
                  'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Continue with {isPayPal ? 'PayPal' : method}
                  </>
                )}
              </button>

              <p className="text-gray-700 text-xs text-center mt-4 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Manual verification · Credentials delivered after approval
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
