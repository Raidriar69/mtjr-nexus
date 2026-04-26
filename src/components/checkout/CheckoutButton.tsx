'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Product } from '@/types';

export function CheckoutButton({ product }: { product: Product }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  async function handleCheckout(buyerEmail: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, buyerEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
      setLoading(false);
    }
  }

  async function handleClick() {
    if (product.isSold) return;

    if (session?.user?.email) {
      await handleCheckout(session.user.email);
    } else {
      setShowEmailInput(true);
    }
  }

  if (showEmailInput && !session) {
    return (
      <div className="space-y-3">
        <p className="text-gray-400 text-sm">Enter your email to receive order confirmation:</p>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
        <Button
          className="w-full"
          size="lg"
          loading={loading}
          onClick={() => {
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              toast.error('Please enter a valid email');
              return;
            }
            handleCheckout(email);
          }}
        >
          Continue to Payment →
        </Button>
        <button
          onClick={() => setShowEmailInput(false)}
          className="text-gray-500 text-sm hover:text-gray-400 w-full text-center"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <Button
      className="w-full"
      size="lg"
      loading={loading}
      disabled={product.isSold}
      onClick={handleClick}
    >
      {product.isSold ? 'Account Sold' : `Buy Now — $${product.price.toFixed(2)}`}
    </Button>
  );
}
