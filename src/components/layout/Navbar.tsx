'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { href: '/products', label: 'All Accounts' },
    { href: '/products?category=fortnite', label: 'Fortnite' },
    { href: '/products?category=valorant', label: 'Valorant' },
    { href: '/products?category=csgo', label: 'CS2' },
    { href: '/products?category=apex', label: 'Apex' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-gray-950/95 backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.05)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <img src="/logo.png" alt="MTJR Nexus" className="h-10 w-auto" />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                {(session.user as any)?.role === 'admin' && (
                  <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors">
                    ⚡ Admin
                  </Link>
                )}
                <Link href="/orders" className="text-sm text-gray-400 hover:text-white transition-colors">
                  My Orders
                </Link>
              </>
            ) : (
              <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                Sign In
              </Link>
            )}

            {/* Cart icon */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-violet-500/50 text-gray-400 hover:text-white transition-all group"
              aria-label="Cart"
            >
              <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-[0_0_8px_rgba(139,92,246,0.6)]">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {session ? (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/register"
                className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]"
              >
                Sign Up
              </Link>
            )}
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/cart" className="relative flex items-center justify-center w-9 h-9 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-950/98 backdrop-blur-md border-t border-gray-800">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-800 space-y-1">
              {session ? (
                <>
                  {(session.user as any)?.role === 'admin' && (
                    <Link href="/admin" className="block px-3 py-2.5 text-sm text-amber-400" onClick={() => setMenuOpen(false)}>
                      ⚡ Admin Panel
                    </Link>
                  )}
                  <Link href="/orders" className="block px-3 py-2.5 text-sm text-gray-400 hover:text-white rounded-md" onClick={() => setMenuOpen(false)}>
                    My Orders
                  </Link>
                  <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }} className="block w-full text-left px-3 py-2.5 text-sm text-gray-500 hover:text-white rounded-md">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-3 py-2.5 text-sm text-gray-400 hover:text-white rounded-md" onClick={() => setMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/register" className="block px-3 py-2.5 text-sm bg-violet-600 text-white rounded-md text-center" onClick={() => setMenuOpen(false)}>
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
