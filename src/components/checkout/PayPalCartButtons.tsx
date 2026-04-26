'use client';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { CartItem } from '@/lib/cart';
import toast from 'react-hot-toast';

interface Props {
  items: CartItem[];
  buyerEmail: string;
  onSuccess: (orderIds: string[]) => void;
}

function Buttons({ items, buyerEmail, onSuccess }: Props) {
  const [{ isPending }] = usePayPalScriptReducer();

  if (isPending) return <div className="h-12 bg-gray-800 animate-pulse rounded-xl" />;

  return (
    <PayPalButtons
      style={{ layout: 'vertical', shape: 'rect', label: 'pay', color: 'gold', height: 48 }}
      createOrder={async () => {
        const email = buyerEmail?.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          toast.error('Enter a valid email first');
          throw new Error('Email required');
        }
        const res = await fetch('/api/paypal/create-cart-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: items.map((i) => i._id), buyerEmail: email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create PayPal order');
        return data.paypalOrderId;
      }}
      onApprove={async (approveData) => {
        try {
          const res = await fetch('/api/paypal/capture-cart-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paypalOrderId: approveData.orderID }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Capture failed');
          toast.success('Payment successful! 🎉');
          onSuccess(data.orderIds);
        } catch (err: any) {
          toast.error(err.message || 'Payment capture failed');
        }
      }}
      onError={() => toast.error('PayPal failed. Try another payment method.')}
      onCancel={() => toast('Payment cancelled.', { icon: '↩️' })}
    />
  );
}

export default function PayPalCartButtons(props: Props) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId || clientId === 'your-paypal-client-id') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
        <p className="text-amber-400 text-sm font-medium">PayPal not configured</p>
        <p className="text-gray-500 text-xs mt-1">Add NEXT_PUBLIC_PAYPAL_CLIENT_ID to .env.local</p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId, currency: 'USD', intent: 'capture' }}>
      <Buttons {...props} />
    </PayPalScriptProvider>
  );
}
