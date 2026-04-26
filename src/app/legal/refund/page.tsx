import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Refund Policy — MTJR Nexus' };

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="text-violet-400 hover:text-violet-300 text-sm transition-colors">← Back to Home</Link>
          <h1 className="text-3xl font-bold text-white mt-4">Refund Policy</h1>
          <p className="text-gray-500 text-sm mt-2">Last updated: January 1, 2025</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-8">
          <p className="text-red-400 font-bold mb-1">⚠️ All Sales Are Final</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Due to the digital nature of our products, all sales are final. Once account credentials have been delivered, we are unable to issue refunds.
          </p>
        </div>
        <div className="space-y-8">
          {[
            { title: 'No-Refund Policy', content: 'MTJR Nexus operates a strict no-refund policy for all digital goods. Once a purchase is confirmed and account credentials are delivered to your email, the transaction is considered complete and no refund will be issued.' },
            { title: 'Exceptions', content: 'The only exceptions are: (1) Duplicate charges due to a technical error on our platform; (2) Non-delivery of credentials within 24 hours due to a system failure. In these rare cases, contact us within 48 hours of purchase with your order ID and proof of payment.' },
            { title: 'Account Bans', content: "MTJR Nexus is not responsible for accounts that are banned, suspended, or restricted after purchase. Account bans may occur due to the game publisher's Terms of Service detection. This risk is disclosed to buyers before purchase, and no refund will be issued in these cases." },
            { title: 'Wrong Information', content: 'If the account delivered does not match the listing description in a material way (e.g., a significantly different rank or missing advertised items), please contact us within 24 hours with evidence. We will review on a case-by-case basis.' },
            { title: 'Chargebacks', content: 'Initiating a chargeback or payment dispute without first contacting us will result in a permanent ban from our platform and may result in legal action. We have zero tolerance for fraudulent chargebacks on delivered digital goods.' },
            { title: 'Contact Us', content: 'If you believe you qualify for an exception, contact our support team with your order ID, the email used at checkout, and a description of the issue. We aim to respond within 24 business hours.' },
          ].map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-bold text-white mb-3">{s.title}</h2>
              <p className="text-gray-400 leading-relaxed">{s.content}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex gap-4 text-sm">
          <Link href="/legal/terms" className="text-violet-400 hover:text-violet-300 transition-colors">Terms of Service →</Link>
          <Link href="/legal/disclaimer" className="text-violet-400 hover:text-violet-300 transition-colors">Disclaimer →</Link>
        </div>
      </div>
    </div>
  );
}
