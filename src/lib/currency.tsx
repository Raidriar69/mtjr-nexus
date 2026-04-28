'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type CurrencyCode = 'USD' | 'OMR' | 'SAR' | 'AED' | 'KWD' | 'BHD';

export const CURRENCIES: { code: CurrencyCode; symbol: string; name: string }[] = [
  { code: 'USD', symbol: '$',   name: 'US Dollar' },
  { code: 'OMR', symbol: 'ر.ع', name: 'Omani Rial' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'BHD', symbol: 'BD',  name: 'Bahraini Dinar' },
];

// GCC currencies are pegged — fallback rates are very stable
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  OMR: 0.3845,
  SAR: 3.75,
  AED: 3.6725,
  KWD: 0.3073,
  BHD: 0.376,
};

const CACHE_KEY = 'mtjrnexus_fx';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface RatesCache {
  rates: Record<CurrencyCode, number>;
  fetchedAt: number;
}

async function fetchRates(): Promise<Record<CurrencyCode, number>> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 21600 } });
    const data = await res.json();
    if (data?.result === 'success' && data.rates) {
      return {
        USD: 1,
        OMR: data.rates.OMR ?? FALLBACK_RATES.OMR,
        SAR: data.rates.SAR ?? FALLBACK_RATES.SAR,
        AED: data.rates.AED ?? FALLBACK_RATES.AED,
        KWD: data.rates.KWD ?? FALLBACK_RATES.KWD,
        BHD: data.rates.BHD ?? FALLBACK_RATES.BHD,
      };
    }
  } catch {}
  return FALLBACK_RATES;
}

// ── Context ───────────────────────────────────────────────────────────────────
interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: Record<CurrencyCode, number>;
  formatPrice: (usdAmount: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(FALLBACK_RATES);

  // Load saved currency preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mtjrnexus_currency') as CurrencyCode | null;
      if (saved && CURRENCIES.find((c) => c.code === saved)) setCurrencyState(saved);
    } catch {}
  }, []);

  // Load rates from cache or API
  useEffect(() => {
    async function loadRates() {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: RatesCache = JSON.parse(cached);
          if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
            setRates(parsed.rates);
            return;
          }
        }
      } catch {}

      const fresh = await fetchRates();
      setRates(fresh);
      try {
        const cache: RatesCache = { rates: fresh, fetchedAt: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch {}
    }
    loadRates();
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try { localStorage.setItem('mtjrnexus_currency', c); } catch {}
  }, []);

  const formatPrice = useCallback(
    (usdAmount: number): string => {
      const rate = rates[currency] ?? 1;
      const converted = usdAmount * rate;
      const info = CURRENCIES.find((c) => c.code === currency)!;

      // Decimal places: KWD/BHD/OMR use 3, others use 2
      const decimals = ['KWD', 'BHD', 'OMR'].includes(currency) ? 3 : 2;
      const formatted = converted.toFixed(decimals);

      return `${info.symbol} ${formatted}`;
    },
    [currency, rates]
  );

  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$';

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, formatPrice, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be inside CurrencyProvider');
  return ctx;
}
