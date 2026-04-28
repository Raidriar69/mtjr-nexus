'use client';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import type { Session } from 'next-auth';
import { CartProvider } from '@/lib/cart';
import { I18nProvider } from '@/lib/i18n';
import { CurrencyProvider } from '@/lib/currency';
import { DirectionSetter } from '@/components/layout/DirectionSetter';

export function Providers({ children, session }: { children: React.ReactNode; session: Session | null }) {
  return (
    <SessionProvider session={session}>
      <I18nProvider>
        <CurrencyProvider>
          <CartProvider>
            <DirectionSetter />
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#1a1a2e',
                  color: '#e2e8f0',
                  border: '1px solid #2d2d4e',
                  borderRadius: '10px',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#10b981', secondary: '#1a1a2e' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#1a1a2e' } },
              }}
            />
          </CartProvider>
        </CurrencyProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
