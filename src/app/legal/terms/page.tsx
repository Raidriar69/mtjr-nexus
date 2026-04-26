import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service — MTJR Nexus' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="text-violet-400 hover:text-violet-300 text-sm transition-colors">← Back to Home</Link>
          <h1 className="text-3xl font-bold text-white mt-4">Terms of Service</h1>
          <p className="text-gray-500 text-sm mt-2">Last updated: January 1, 2025</p>
        </div>
        <div className="prose prose-invert max-w-none space-y-8">
          {[
            { title: '1. Acceptance of Terms', content: 'By accessing or using MTJR Nexus ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, you must not use the Service. We reserve the right to modify these terms at any time, and continued use of the Service constitutes acceptance of any changes.' },
            { title: '2. Nature of Service', content: 'MTJR Nexus is a digital marketplace for the sale of pre-existing gaming account credentials. We act as a seller and are not affiliated with the games, game publishers, or platforms referenced on this site. All sales are of pre-owned digital access credentials.' },
            { title: '3. Account Purchases', content: 'All purchases are for digital goods delivered electronically. Once you complete a purchase, you will receive account credentials (email/password) via the email address provided at checkout. It is your responsibility to immediately secure the account by changing the password after receipt.' },
            { title: '4. Prohibited Uses', content: 'You may not use the Service if you are under 18 years of age. You may not resell accounts purchased through MTJR Nexus without express written permission. You may not use fraudulent payment methods or engage in chargebacks without first contacting our support team.' },
            { title: '5. Limitation of Liability', content: 'MTJR Nexus is not responsible for any bans, suspensions, or other consequences resulting from the use of purchased accounts. All accounts are sold as-is. We do not guarantee the continued availability of account features, ranks, or items after purchase, as these are subject to change by the respective game publishers.' },
            { title: '6. Intellectual Property', content: 'All in-game items, skins, and ranks described in our listings are the intellectual property of their respective game publishers. MTJR Nexus merely facilitates the transfer of account access credentials.' },
            { title: '7. Privacy', content: 'We collect minimal personal information (email address) necessary to complete transactions. We do not sell your personal data to third parties. Payment information is handled entirely by Stripe/PayPal and is never stored on our servers.' },
            { title: '8. Governing Law', content: 'These Terms shall be governed by applicable law. Any disputes arising from these Terms shall be resolved through binding arbitration, waiving the right to a jury trial or class action.' },
          ].map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold text-white mb-3">{section.title}</h2>
              <p className="text-gray-400 leading-relaxed">{section.content}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex gap-4 text-sm">
          <Link href="/legal/refund" className="text-violet-400 hover:text-violet-300 transition-colors">Refund Policy →</Link>
          <Link href="/legal/disclaimer" className="text-violet-400 hover:text-violet-300 transition-colors">Disclaimer →</Link>
        </div>
      </div>
    </div>
  );
}
