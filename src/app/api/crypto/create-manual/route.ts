import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { generateInvoiceId } from '@/lib/verificationCode';
import { convertUsdToCrypto, WALLET_ADDRESSES } from '@/lib/cryptoConversion';

const SUPPORTED_COINS = ['BTC', 'ETH', 'SOL', 'LTC'];

export async function POST(req: NextRequest) {
  try {
    const { productIds, quantities, buyerEmail, coin } = await req.json();

    if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'No products specified' }, { status: 400 });
    }
    if (!coin || !SUPPORTED_COINS.includes(coin)) {
      return NextResponse.json({ error: `Unsupported coin. Use: ${SUPPORTED_COINS.join(', ')}` }, { status: 400 });
    }

    const walletAddress = WALLET_ADDRESSES[coin];
    if (!walletAddress) {
      return NextResponse.json({ error: 'No wallet configured for this coin' }, { status: 400 });
    }

    await connectDB();

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    // ── Validate products and sum total ──────────────────────────────────────
    let totalUsd = 0;
    const productDetails: {
      id: string; title: string; game: string; price: number; qty: number; image?: string;
    }[] = [];

    for (let i = 0; i < productIds.length; i++) {
      const qty = Math.max(1, Number(quantities?.[i]) || 1);
      const product = await Product.findById(productIds[i]).lean() as any;

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${productIds[i]}` }, { status: 404 });
      }
      if (product.isSold) {
        return NextResponse.json({ error: `"${product.title}" is already sold` }, { status: 409 });
      }
      // Bulk stock check: ensure enough available accounts for the requested qty
      if (product.productType === 'bulk') {
        const availableCount = (product.accounts ?? []).filter((a: any) => a.status === 'available').length;
        if (availableCount < qty) {
          return NextResponse.json(
            { error: `Only ${availableCount} account(s) available for "${product.title}", but ${qty} requested` },
            { status: 409 }
          );
        }
      }

      totalUsd += product.price * qty;
      productDetails.push({
        id: String(product._id),
        title: product.title,
        game: product.game,
        price: product.price,
        qty,
        image: product.images?.[0],
      });
    }

    // ── Generate unique invoice ID and crypto amount ──────────────────────────
    const cryptoInvoiceId = generateInvoiceId();

    // Convert total USD → unique crypto amount (includes random noise)
    const cryptoManualAmount = await convertUsdToCrypto(totalUsd, coin);

    // ── Create one order per product ─────────────────────────────────────────
    const orderIds: string[] = [];

    for (const pd of productDetails) {
      const order = await Order.create({
        userId,
        buyerEmail: buyerEmail.trim(),
        productId: pd.id,
        amount: Math.round(pd.price * pd.qty * 100),
        currency: 'usd',
        status: 'pending',
        paymentMethod: 'crypto_manual',
        quantity: pd.qty,
        cryptoInvoiceId,
        cryptoManualAmount,
        cryptoManualCoin: coin,
        cryptoManualAddress: walletAddress,
        cryptoManual: true,
      });
      orderIds.push(String(order._id));
    }

    return NextResponse.json({
      success: true,
      orderIds,
      primaryOrderId: orderIds[0],
      cryptoInvoiceId,
      cryptoManualAmount,
      coin,
      walletAddress,
      totalCents: Math.round(totalUsd * 100),
      products: productDetails,
      buyerEmail: buyerEmail.trim(),
    });
  } catch (err: any) {
    console.error('[crypto/create-manual]', err);
    return NextResponse.json({ error: 'Failed to create crypto order' }, { status: 500 });
  }
}
