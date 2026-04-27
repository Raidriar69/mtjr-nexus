import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center mb-4 w-fit">
              <img src="/logo.png" alt="MTJR Nexus" className="h-12 w-auto" />
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Premium digital gaming accounts marketplace. Find rare skins, high-rank accounts, and more — delivered instantly.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-md px-3 py-1.5">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-400 text-xs">SSL Secured</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-md px-3 py-1.5">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-gray-400 text-xs">PCI Compliant</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/products', label: 'All Accounts' },
                { href: '/products?category=fortnite', label: 'Fortnite' },
                { href: '/products?category=valorant', label: 'Valorant' },
                { href: '/products?category=csgo', label: 'CS2' },
                { href: '/products?category=apex', label: 'Apex Legends' },
                { href: '/products?category=steam', label: 'Steam' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-violet-400 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/legal/terms', label: 'Terms of Service' },
                { href: '/legal/refund', label: 'Refund Policy' },
                { href: '/legal/disclaimer', label: 'Disclaimer' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-violet-400 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">© {new Date().getFullYear()} MTJR Nexus. All rights reserved.</p>
          <p className="text-gray-700 text-xs">
            Payments secured by Stripe · We do not store card details
          </p>
        </div>
      </div>
    </footer>
  );
}
