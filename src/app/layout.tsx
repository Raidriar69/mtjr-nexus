import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'MTJR Nexus — Premium Gaming Accounts',
  description:
    'Buy verified gaming accounts for Fortnite, Valorant, CS2, Apex Legends and more. Instant delivery, secure payments via Card, PayPal & Crypto.',
  keywords: ['gaming accounts', 'buy gaming accounts', 'fortnite accounts', 'valorant accounts', 'MTJR Nexus'],
  openGraph: {
    title: 'MTJR Nexus — Premium Gaming Accounts',
    description: 'Buy verified gaming accounts. Instant delivery. Card, PayPal & Crypto accepted.',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gray-950 text-gray-100 min-h-screen flex flex-col">
        <Providers session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
