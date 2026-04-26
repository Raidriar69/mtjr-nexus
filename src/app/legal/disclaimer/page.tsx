import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Disclaimer — MTJR Nexus' };

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="text-violet-400 hover:text-violet-300 text-sm transition-colors">← Back to Home</Link>
          <h1 className="text-3xl font-bold text-white mt-4">Disclaimer</h1>
          <p className="text-gray-500 text-sm mt-2">Last updated: January 1, 2025</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mb-8">
          <p className="text-amber-400 font-bold mb-1">Important Notice</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Purchasing and using gaming accounts obtained from third-party marketplaces may violate the Terms of Service of the respective games. Please read this disclaimer carefully before making any purchase.
          </p>
        </div>
        <div className="space-y-8">
          {[
            { title: 'Third-Party Account Risk', content: 'Accounts sold on MTJR Nexus are pre-existing accounts created by third parties. The purchase and use of these accounts may violate the End User License Agreements (EULA) or Terms of Service of games including but not limited to Fortnite (Epic Games), Valorant (Riot Games), CS2 (Valve), and Apex Legends (EA/Respawn). MTJR Nexus assumes no responsibility for any enforcement action taken by game publishers.' },
            { title: 'Ban Risk Disclosure', content: "By purchasing an account on MTJR Nexus, you acknowledge that the account may be subject to detection and banning by the game's anti-cheat or account security systems. MTJR Nexus will not issue refunds for banned accounts, as this risk is disclosed here and at the point of purchase." },
            { title: 'No Affiliation', content: 'MTJR Nexus is not affiliated with, endorsed by, or sponsored by any game publisher, including Epic Games, Riot Games, Valve, Electronic Arts, Activision Blizzard, or any other company whose games are referenced on this platform. All game names, logos, and trademarks are the property of their respective owners.' },
            { title: 'Accuracy of Listings', content: 'We make every effort to accurately describe accounts listed on our platform. However, game updates may affect the availability or appearance of in-game items, ranks, and other features. We cannot guarantee that all listed content will remain unchanged after purchase.' },
            { title: 'Age Restriction', content: 'This service is intended for users 18 years of age or older. By using MTJR Nexus, you confirm that you are at least 18 years old or have the consent of a parent or guardian.' },
            { title: 'Use at Your Own Risk', content: 'All purchases made through MTJR Nexus are made at your own risk. We recommend that buyers research the terms and risks associated with third-party account purchases before completing a transaction.' },
          ].map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-bold text-white mb-3">{s.title}</h2>
              <p className="text-gray-400 leading-relaxed">{s.content}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex gap-4 text-sm">
          <Link href="/legal/terms" className="text-violet-400 hover:text-violet-300 transition-colors">Terms of Service →</Link>
          <Link href="/legal/refund" className="text-violet-400 hover:text-violet-300 transition-colors">Refund Policy →</Link>
        </div>
      </div>
    </div>
  );
}
