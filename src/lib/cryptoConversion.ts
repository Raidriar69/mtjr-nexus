/**
 * Crypto conversion utilities for manual payment flow.
 *
 * Converts USD amounts to crypto equivalents using live CoinGecko rates,
 * then adds a small random noise to the last few decimal places so each
 * order has a unique on-chain amount for easy admin matching.
 */

// CoinGecko IDs for each supported coin
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  LTC: 'litecoin',
};

// How many decimal places to show / store for each coin
const DECIMAL_PLACES: Record<string, number> = {
  BTC: 8,
  ETH: 8,
  SOL: 6,
  LTC: 8,
};

// Fallback rates (USD per 1 coin) if CoinGecko is unavailable
const FALLBACK_RATES: Record<string, number> = {
  BTC: 95000,
  ETH: 3300,
  SOL: 150,
  LTC: 90,
};

// Wallet addresses
export const WALLET_ADDRESSES: Record<string, string> = {
  BTC: 'bc1qy38c0ng6785cqu72zgfepgr2xaqynp83fndlwu',
  ETH: '0x602143fe4c70Dc824266F7D0f7272b3DE3b7EC99',
  SOL: 'E3y2Je4tBNEVgsYcGqxtzZfoqhTZtBBcUW6LYzr5VKMx',
  LTC: 'ltc1q6d84lt3p867lu49lwwpgue38szzq0h63yqsh9c',
};

/**
 * Adds small random noise to the last 3 significant decimal places
 * so that every order has a distinct crypto amount for identification.
 */
function addUniquenessNoise(amount: number, coin: string): number {
  const places = DECIMAL_PLACES[coin] ?? 8;
  // Noise range: ±1 in the last 3 decimal positions
  // e.g. for ETH (8 places) noise is up to ±0.000001
  const noiseMagnitude = Math.pow(10, -(places - 3));
  const noise = Math.random() * noiseMagnitude;
  return parseFloat((amount + noise).toFixed(places));
}

/**
 * Fetches the live USD price for a coin from CoinGecko.
 * Returns null on failure so callers can fall back.
 */
async function fetchLiveRate(coin: string): Promise<number | null> {
  try {
    const id = COINGECKO_IDS[coin];
    if (!id) return null;

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
      {
        headers: { Accept: 'application/json' },
        // 3-second timeout via AbortController
        signal: AbortSignal.timeout(3000),
      }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const price = data?.[id]?.usd;
    return typeof price === 'number' && price > 0 ? price : null;
  } catch {
    return null;
  }
}

/**
 * Converts a USD amount to the equivalent crypto amount with unique noise.
 *
 * @param usdAmount  Dollar amount (e.g. 12.99)
 * @param coin       Coin symbol: BTC | ETH | SOL | LTC
 * @returns          Unique crypto amount string, e.g. "0.00443862"
 */
export async function convertUsdToCrypto(usdAmount: number, coin: string): Promise<number> {
  if (!COINGECKO_IDS[coin]) throw new Error(`Unsupported coin: ${coin}`);

  let rate = await fetchLiveRate(coin);
  if (!rate) {
    console.warn(`[cryptoConversion] Live rate unavailable for ${coin}, using fallback`);
    rate = FALLBACK_RATES[coin] ?? 1;
  }

  const rawAmount = usdAmount / rate;
  return addUniquenessNoise(rawAmount, coin);
}

/** Human-readable display of a crypto amount (strips trailing zeros). */
export function formatCryptoAmount(amount: number, coin: string): string {
  const places = DECIMAL_PLACES[coin] ?? 8;
  return amount.toFixed(places).replace(/0+$/, '').replace(/\.$/, '');
}
