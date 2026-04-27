import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { Badge } from '@/components/ui/Badge';
import { ProductActions } from '@/components/products/ProductActions';
import type { Metadata } from 'next';

interface Props {
  params: { id: string };
}

async function getProduct(id: string) {
  try {
    await connectDB();
    const raw = await Product.findById(id).lean() as any;
    if (!raw) return null;
    // Compute availableStock from accounts array (server-side only)
    const availableStock: number | undefined =
      raw.productType === 'bulk'
        ? ((raw.accounts ?? []) as any[]).filter((a: any) => !a.sold).length
        : undefined;
    // Strip accounts (credentials) before serialising to client
    const { accounts: _accounts, accountEmail: _ae, accountPassword: _ap, ...safe } = raw;
    return JSON.parse(JSON.stringify({ ...safe, availableStock }));
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.id);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: `${product.title} — MTJR Nexus`,
    description: product.description?.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* ── Left: Images + Details ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Main image */}
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-950/30 to-gray-900">
                  <svg className="w-20 h-20 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnail gallery */}
            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.slice(1).map((img: string, i: number) => (
                  <div key={i} className="aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                    <img src={img} alt={`${product.title} ${i + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3 text-lg">Description</h3>
              <p className="text-gray-400 leading-relaxed whitespace-pre-line text-sm">{product.description}</p>
            </div>

            {/* Skins & Items */}
            {(product.skins?.length > 0 || product.items?.length > 0) && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 text-lg">Included Content</h3>
                {product.skins?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-violet-400 text-sm font-medium mb-2">🎨 Skins ({product.skins.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {product.skins.map((skin: string) => (
                        <span key={skin} className="bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs px-2.5 py-1 rounded-full">{skin}</span>
                      ))}
                    </div>
                  </div>
                )}
                {product.items?.length > 0 && (
                  <div>
                    <p className="text-cyan-400 text-sm font-medium mb-2">🎯 Items ({product.items.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {product.items.map((item: string) => (
                        <span key={item} className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs px-2.5 py-1 rounded-full">{item}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Purchase Panel ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="default">{product.game}</Badge>
                  {product.productType === 'bulk' && (
                    <Badge variant={product.availableStock && product.availableStock > 0 ? 'default' : 'sold'}>
                      {product.availableStock && product.availableStock > 0
                        ? `📦 ${product.availableStock} in stock`
                        : '📦 Out of Stock'}
                    </Badge>
                  )}
                  {product.productType === 'shared' && <Badge variant="default">♻️ Shared</Badge>}
                  {product.isFeatured && <Badge variant="warning">⭐ Featured</Badge>}
                  {product.isSold && product.productType !== 'bulk' && <Badge variant="sold">Sold Out</Badge>}
                  {discount && !product.isSold && <Badge variant="danger">-{discount}%</Badge>}
                </div>

                <h1 className="text-white text-2xl font-bold mb-4 leading-tight">{product.title}</h1>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {product.rank && (
                    <div className="bg-gray-800/60 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-0.5">Rank</p>
                      <p className="text-amber-400 font-semibold text-sm">🏆 {product.rank}</p>
                    </div>
                  )}
                  {product.level > 0 && (
                    <div className="bg-gray-800/60 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-0.5">Level</p>
                      <p className="text-white font-semibold text-sm">⚡ {product.level}</p>
                    </div>
                  )}
                  {product.platform && (
                    <div className="bg-gray-800/60 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-0.5">Platform</p>
                      <p className="text-white font-semibold text-sm">🖥️ {product.platform}</p>
                    </div>
                  )}
                  {product.skins?.length > 0 && (
                    <div className="bg-gray-800/60 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-0.5">Skins</p>
                      <p className="text-white font-semibold text-sm">🎨 {product.skins.length}</p>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="text-4xl font-black text-white">${product.price.toFixed(2)}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-gray-600 text-xl line-through">${product.originalPrice.toFixed(2)}</span>
                  )}
                </div>

                {/* Action buttons */}
                <ProductActions product={product} />

                {/* Trust signals */}
                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Instant delivery after payment
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    PayPal & Crypto accepted
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Read our refund policy before purchasing
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <p className="text-amber-400 text-xs font-medium mb-1">⚠️ Buyer Disclaimer</p>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Purchasing gaming accounts may violate the game's Terms of Service.
                  MTJR Nexus is not responsible for account bans. All sales are final.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
