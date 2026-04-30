'use client';
import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminOrder {
  _id: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  // PayPal manual
  paypalInvoiceId?: string;
  paypalVerificationCode?: string;
  paypalManual?: boolean;
  // Crypto manual
  cryptoInvoiceId?: string;
  cryptoManualAmount?: number;
  cryptoManualCoin?: string;
  cryptoManualAddress?: string;
  cryptoManual?: boolean;
  quantity: number;
  createdAt: string;
  productId?: { _id?: string; game?: string; title?: string; price?: number; images?: string[] };
}

// ── Coin accent map ───────────────────────────────────────────────────────────
const COIN_ACCENT: Record<string, { color: string; bg: string; border: string; symbol: string }> = {
  BTC: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', symbol: '₿' },
  ETH: { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   symbol: 'Ξ' },
  SOL: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', symbol: '◎' },
  LTC: { color: 'text-gray-300',   bg: 'bg-gray-400/10',   border: 'border-gray-400/30',   symbol: 'Ł' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusVariant(s: string): 'success' | 'warning' | 'danger' | 'default' {
  if (s === 'completed')            return 'success';
  if (s === 'pending' || s === 'waiting_confirmation') return 'warning';
  if (s === 'failed' || s === 'rejected') return 'danger';
  return 'default';
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    pending:              'Pending',
    waiting_confirmation: 'Awaiting Review',
    completed:            'Completed',
    failed:               'Failed',
    refunded:             'Refunded',
    rejected:             'Rejected',
  };
  return map[s] ?? s;
}

// ── PayPal verification card ──────────────────────────────────────────────────
function PayPalOrderCard({
  order,
  onAction,
}: {
  order: AdminOrder;
  onAction: (id: string, action: 'approve' | 'reject') => Promise<void>;
}) {
  const [acting, setActing] = useState<'approve' | 'reject' | null>(null);

  async function act(action: 'approve' | 'reject') {
    setActing(action);
    await onAction(order._id, action);
    setActing(null);
  }

  const isWaiting = order.status === 'waiting_confirmation';

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 transition-colors ${
      isWaiting ? 'border-amber-500/30' : 'border-gray-800'
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div className="min-w-0">
          {order.productId?.game && (
            <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
              {order.productId.game}
            </p>
          )}
          <p className="text-white font-semibold text-sm truncate max-w-xs">
            {order.productId?.title ?? `Order #${order._id.slice(-8).toUpperCase()}`}
          </p>
          <p className="text-gray-600 text-xs mt-0.5">{order.buyerEmail}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-emerald-400 font-bold text-sm price-ltr">
            ${(order.amount / 100).toFixed(2)}
          </span>
          <Badge variant={statusVariant(order.status)}>
            {statusLabel(order.status)}
          </Badge>
        </div>
      </div>

      {/* Verification info */}
      <div className="bg-gray-800/60 rounded-xl p-4 mb-4 space-y-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-gray-500 text-xs font-medium">Invoice ID</span>
          <span className="text-white font-mono text-xs font-semibold">
            {order.paypalInvoiceId ?? '—'}
          </span>
        </div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <span className="text-gray-500 text-xs font-medium flex-shrink-0">Verification Code</span>
          <span className="text-amber-300 font-mono text-xs text-right">
            {order.paypalVerificationCode ?? '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500 text-xs font-medium">Date</span>
          <span className="text-gray-400 text-xs">
            {new Date(order.createdAt).toLocaleString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Actions — only for waiting_confirmation */}
      {isWaiting && (
        <div className="flex gap-2.5">
          <button
            onClick={() => act('approve')}
            disabled={acting !== null}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            {acting === 'approve' ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            Approve &amp; Deliver
          </button>
          <button
            onClick={() => act('reject')}
            disabled={acting !== null}
            className="flex-1 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            {acting === 'reject' ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            Reject
          </button>
        </div>
      )}

      {order.status === 'completed' && (
        <p className="text-emerald-400 text-xs font-medium text-center py-1">
          ✓ Approved & Delivered
        </p>
      )}
      {order.status === 'rejected' && (
        <p className="text-red-400 text-xs font-medium text-center py-1">
          ✗ Rejected
        </p>
      )}
      {order.status === 'pending' && (
        <p className="text-gray-500 text-xs text-center py-1">
          Waiting for user to mark as paid
        </p>
      )}
    </div>
  );
}

// ── Crypto verification card ──────────────────────────────────────────────────
function CryptoOrderCard({
  order,
  onAction,
}: {
  order: AdminOrder;
  onAction: (id: string, action: 'approve' | 'reject') => Promise<void>;
}) {
  const [acting, setActing] = useState<'approve' | 'reject' | null>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);

  async function act(action: 'approve' | 'reject') {
    setActing(action);
    await onAction(order._id, action);
    setActing(null);
  }

  async function copyToClipboard(text: string, setter: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {}
  }

  const isWaiting = order.status === 'waiting_confirmation';
  const coin = order.cryptoManualCoin ?? 'BTC';
  const accent = COIN_ACCENT[coin] ?? COIN_ACCENT['BTC'];

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 transition-colors ${
      isWaiting ? `${accent.border}` : 'border-gray-800'
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div className="min-w-0">
          {order.productId?.game && (
            <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
              {order.productId.game}
            </p>
          )}
          <p className="text-white font-semibold text-sm truncate max-w-xs">
            {order.productId?.title ?? `Order #${order._id.slice(-8).toUpperCase()}`}
          </p>
          <p className="text-gray-600 text-xs mt-0.5">{order.buyerEmail}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`w-8 h-8 ${accent.bg} border ${accent.border} rounded-lg flex items-center justify-center ${accent.color} font-black text-base`}>
            {accent.symbol}
          </div>
          <Badge variant={statusVariant(order.status)}>
            {statusLabel(order.status)}
          </Badge>
        </div>
      </div>

      {/* Crypto verification info */}
      <div className="bg-gray-800/60 rounded-xl p-4 mb-4 space-y-3">
        {/* Invoice */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-500 text-xs font-medium">Invoice ID</span>
          <span className="text-white font-mono text-xs font-semibold">{order.cryptoInvoiceId ?? '—'}</span>
        </div>

        {/* Expected amount */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-500 text-xs font-medium flex-shrink-0">Expected Amount</span>
          <div className="flex items-center gap-2">
            <span className={`${accent.color} font-mono text-sm font-bold`}>
              {order.cryptoManualAmount} {coin}
            </span>
            <button
              onClick={() => copyToClipboard(String(order.cryptoManualAmount), setCopiedAmt)}
              className={`text-[10px] font-semibold px-2 py-1 rounded border transition-all ${
                copiedAmt ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-gray-700 text-gray-400 border-gray-600 hover:text-white'
              }`}
            >
              {copiedAmt ? '✓' : 'Copy'}
            </button>
          </div>
        </div>

        {/* USD equivalent */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-500 text-xs font-medium">USD Value</span>
          <span className="text-emerald-400 text-xs font-semibold">${(order.amount / 100).toFixed(2)}</span>
        </div>

        {/* Wallet address */}
        {order.cryptoManualAddress && (
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-gray-500 text-xs font-medium">Wallet Address</span>
              <button
                onClick={() => copyToClipboard(order.cryptoManualAddress!, setCopiedAddr)}
                className={`text-[10px] font-semibold px-2 py-1 rounded border transition-all ${
                  copiedAddr ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-gray-700 text-gray-400 border-gray-600 hover:text-white'
                }`}
              >
                {copiedAddr ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-gray-400 font-mono text-[10px] break-all leading-relaxed bg-gray-900/60 rounded p-2">
              {order.cryptoManualAddress}
            </p>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-500 text-xs font-medium">Date</span>
          <span className="text-gray-400 text-xs">
            {new Date(order.createdAt).toLocaleString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Actions */}
      {isWaiting && (
        <div className="flex gap-2.5">
          <button
            onClick={() => act('approve')}
            disabled={acting !== null}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            {acting === 'approve' ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            Approve & Deliver
          </button>
          <button
            onClick={() => act('reject')}
            disabled={acting !== null}
            className="flex-1 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            {acting === 'reject' ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            Reject
          </button>
        </div>
      )}
      {order.status === 'completed' && (
        <p className="text-emerald-400 text-xs font-medium text-center py-1">✓ Approved & Delivered</p>
      )}
      {order.status === 'rejected' && (
        <p className="text-red-400 text-xs font-medium text-center py-1">✗ Rejected</p>
      )}
      {order.status === 'pending' && (
        <p className="text-gray-500 text-xs text-center py-1">Waiting for user to mark as paid</p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type AllTab = 'all' | 'completed' | 'pending' | 'waiting_confirmation' | 'failed' | 'rejected';
type PayPalTab = 'waiting' | 'pending' | 'completed' | 'rejected';
type CryptoTab = 'waiting' | 'pending' | 'completed' | 'rejected';

export default function AdminOrdersPage() {
  const [orders, setOrders]           = useState<AdminOrder[]>([]);
  const [loading, setLoading]         = useState(true);
  const [allFilter, setAllFilter]     = useState<AllTab>('all');
  const [paypalTab, setPaypalTab]     = useState<PayPalTab>('waiting');
  const [cryptoTab, setCryptoTab]     = useState<CryptoTab>('waiting');
  const [activeSection, setActiveSection] = useState<'all' | 'paypal' | 'crypto'>('all');

  const loadOrders = useCallback(() => {
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const paypalOrders  = orders.filter((o) => o.paypalManual || o.paymentMethod === 'paypal_manual');
  const cryptoOrders  = orders.filter((o) => o.cryptoManual || o.paymentMethod === 'crypto_manual');
  const waitingPayPal = paypalOrders.filter((o) => o.status === 'waiting_confirmation').length;
  const waitingCrypto = cryptoOrders.filter((o)  => o.status === 'waiting_confirmation').length;
  const waitingCount  = waitingPayPal + waitingCrypto;

  const filteredAll = allFilter === 'all' ? orders : orders.filter((o) => o.status === allFilter);
  const revenue     = orders.filter((o) => o.status === 'completed').reduce((acc, o) => acc + o.amount, 0);

  const filteredPayPal = paypalOrders.filter((o) => {
    if (paypalTab === 'waiting')    return o.status === 'waiting_confirmation';
    if (paypalTab === 'pending')    return o.status === 'pending';
    if (paypalTab === 'completed')  return o.status === 'completed';
    if (paypalTab === 'rejected')   return o.status === 'rejected';
    return true;
  });

  const filteredCrypto = cryptoOrders.filter((o) => {
    if (cryptoTab === 'waiting')    return o.status === 'waiting_confirmation';
    if (cryptoTab === 'pending')    return o.status === 'pending';
    if (cryptoTab === 'completed')  return o.status === 'completed';
    if (cryptoTab === 'rejected')   return o.status === 'rejected';
    return true;
  });

  async function handlePayPalAction(orderId: string, action: 'approve' | 'reject') {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      toast.success(action === 'approve' ? '✅ Payment approved — credentials delivered!' : '❌ Payment rejected');
      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? { ...o, status: action === 'approve' ? 'completed' : 'rejected' }
            : o
        )
      );
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            {orders.length} total · Revenue:{' '}
            <span className="text-emerald-400 font-semibold">${(revenue / 100).toFixed(2)}</span>
            {waitingPayPal > 0 && (
              <span className="ml-3 text-amber-400 font-semibold">
                · {waitingPayPal} PayPal{waitingPayPal !== 1 ? 's' : ''} need review
              </span>
            )}
            {waitingCrypto > 0 && (
              <span className="ml-3 text-orange-400 font-semibold">
                · {waitingCrypto} Crypto{waitingCrypto !== 1 ? 's' : ''} need review
              </span>
            )}
          </p>
        </div>

        {/* Section switcher */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              activeSection === 'all'
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            📦 All Orders
          </button>
          <button
            onClick={() => setActiveSection('paypal')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border relative ${
              activeSection === 'paypal'
                ? 'bg-[#009cde] border-[#009cde] text-white'
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            🅿 PayPal Verify
            {waitingPayPal > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {waitingPayPal}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSection('crypto')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border relative ${
              activeSection === 'crypto'
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            ₿ Crypto Verify
            {waitingCrypto > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {waitingCrypto}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── ALL ORDERS SECTION ── */}
      {activeSection === 'all' && (
        <>
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'completed', 'waiting_confirmation', 'pending', 'rejected', 'failed'] as AllTab[]).map((s) => {
              const label = s === 'waiting_confirmation' ? 'Awaiting Review' : s.charAt(0).toUpperCase() + s.slice(1);
              const count = s === 'all' ? orders.length : orders.filter((o) => o.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setAllFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    allFilter === s
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  {label} <span className="text-xs opacity-60 ml-0.5">({count})</span>
                </button>
              );
            })}
          </div>

          {filteredAll.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No orders found.</div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-4 py-3 text-left text-gray-500 font-medium">Order</th>
                      <th className="px-4 py-3 text-left text-gray-500 font-medium hidden md:table-cell">Buyer</th>
                      <th className="px-4 py-3 text-left text-gray-500 font-medium hidden sm:table-cell">Product</th>
                      <th className="px-4 py-3 text-left text-gray-500 font-medium">Amount</th>
                      <th className="px-4 py-3 text-left text-gray-500 font-medium">Method</th>
                      <th className="px-4 py-3 text-left text-gray-500 font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-gray-500 font-medium hidden lg:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredAll.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-gray-400 font-mono text-xs">
                              #{order._id.slice(-8).toUpperCase()}
                            </span>
                            {order.paypalInvoiceId && (
                              <p className="text-[#009cde] font-mono text-[10px] mt-0.5">{order.paypalInvoiceId}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-gray-400 text-xs truncate max-w-[160px] block">{order.buyerEmail}</span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div>
                            <p className="text-white text-xs font-medium truncate max-w-[160px]">
                              {order.productId?.title ?? '—'}
                            </p>
                            <p className="text-gray-600 text-xs">{order.productId?.game}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-white font-semibold">${(order.amount / 100).toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-500 text-xs capitalize">
                            {order.paymentMethod === 'paypal_manual'  ? '🅿 PayPal Manual' :
                             order.paymentMethod === 'crypto_manual'  ? `₿ ${order.cryptoManualCoin ?? 'Crypto'} Manual` :
                             order.paymentMethod ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant(order.status)}>
                            {statusLabel(order.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-gray-500 text-xs">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PAYPAL VERIFICATION SECTION ── */}
      {activeSection === 'paypal' && (
        <div className="space-y-5">

          {/* Info banner */}
          <div className="bg-[#009cde]/5 border border-[#009cde]/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#009cde]/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#009cde]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[#009cde] text-sm font-semibold mb-0.5">Manual PayPal Verification</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  To approve: open PayPal, confirm payment received, and verify the 4-word code matches. Then click <strong className="text-white">Approve & Deliver</strong> to automatically send credentials to the buyer.
                </p>
              </div>
            </div>
          </div>

          {/* Status tabs */}
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'waiting' as PayPalTab, label: 'Needs Review', color: 'amber' },
              { id: 'pending' as PayPalTab, label: 'Pending',       color: 'gray' },
              { id: 'completed' as PayPalTab, label: 'Approved',    color: 'emerald' },
              { id: 'rejected' as PayPalTab,  label: 'Rejected',    color: 'red' },
            ]).map(({ id, label, color }) => {
              const count = paypalOrders.filter((o) => {
                if (id === 'waiting')   return o.status === 'waiting_confirmation';
                if (id === 'pending')   return o.status === 'pending';
                if (id === 'completed') return o.status === 'completed';
                if (id === 'rejected')  return o.status === 'rejected';
                return false;
              }).length;

              const activeClass =
                id === 'waiting'   ? 'bg-amber-500 border-amber-500 text-white' :
                id === 'completed' ? 'bg-emerald-600 border-emerald-600 text-white' :
                id === 'rejected'  ? 'bg-red-600 border-red-600 text-white' :
                                     'bg-gray-600 border-gray-600 text-white';

              return (
                <button
                  key={id}
                  onClick={() => setPaypalTab(id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    paypalTab === id
                      ? activeClass
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {label}{' '}
                  <span className={`text-xs ml-0.5 ${paypalTab === id ? 'opacity-80' : 'opacity-50'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cards */}
          {filteredPayPal.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No {paypalTab === 'waiting' ? 'orders needing review' : paypalTab + ' orders'}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredPayPal.map((order) => (
                <PayPalOrderCard
                  key={order._id}
                  order={order}
                  onAction={handlePayPalAction}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CRYPTO VERIFICATION SECTION ── */}
      {activeSection === 'crypto' && (
        <div className="space-y-5">

          {/* Info banner */}
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500/15 rounded-lg flex items-center justify-center flex-shrink-0 text-orange-400 font-black text-base">
                ₿
              </div>
              <div>
                <p className="text-orange-400 text-sm font-semibold mb-0.5">Manual Crypto Verification</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Check your wallet for the <strong className="text-white">exact crypto amount</strong> shown on each card. The unique decimals identify the payment. Once confirmed on-chain, click <strong className="text-white">Approve & Deliver</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Status tabs */}
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'waiting' as CryptoTab, label: 'Needs Review' },
              { id: 'pending' as CryptoTab, label: 'Pending' },
              { id: 'completed' as CryptoTab, label: 'Approved' },
              { id: 'rejected' as CryptoTab,  label: 'Rejected' },
            ]).map(({ id, label }) => {
              const count = cryptoOrders.filter((o) => {
                if (id === 'waiting')   return o.status === 'waiting_confirmation';
                if (id === 'pending')   return o.status === 'pending';
                if (id === 'completed') return o.status === 'completed';
                if (id === 'rejected')  return o.status === 'rejected';
                return false;
              }).length;

              const activeClass =
                id === 'waiting'   ? 'bg-amber-500 border-amber-500 text-white' :
                id === 'completed' ? 'bg-emerald-600 border-emerald-600 text-white' :
                id === 'rejected'  ? 'bg-red-600 border-red-600 text-white' :
                                     'bg-gray-600 border-gray-600 text-white';

              return (
                <button
                  key={id}
                  onClick={() => setCryptoTab(id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    cryptoTab === id
                      ? activeClass
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {label}{' '}
                  <span className={`text-xs ml-0.5 ${cryptoTab === id ? 'opacity-80' : 'opacity-50'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cards */}
          {filteredCrypto.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-700 text-2xl font-black">
                ₿
              </div>
              <p className="text-gray-500 text-sm">No {cryptoTab === 'waiting' ? 'orders needing review' : cryptoTab + ' crypto orders'}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredCrypto.map((order) => (
                <CryptoOrderCard
                  key={order._id}
                  order={order}
                  onAction={handlePayPalAction}
                />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
