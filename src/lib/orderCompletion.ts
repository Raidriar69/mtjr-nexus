import { connectDB } from './mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { sendOrderConfirmation, sendBulkOrderConfirmation } from './email';

/**
 * Atomically claim one unsold bulk account.
 * Uses the positional $ operator so the find-then-update window is safe against races.
 */
async function claimOneBulkAccount(
  productId: string
): Promise<{ email: string; password: string } | null> {
  // Project just the first unsold account using the positional operator
  const snapshot = await Product.findOne(
    { _id: productId, 'accounts.sold': false },
    { 'accounts.$': 1 } as any
  ).lean() as any;

  if (!snapshot?.accounts?.[0]) return null;

  const acct = snapshot.accounts[0];

  // Atomically mark that specific account sold by its subdoc _id
  const updated = await Product.findOneAndUpdate(
    { _id: productId, 'accounts._id': acct._id, 'accounts.sold': false },
    { $set: { 'accounts.$.sold': true } }
  );

  // Null means the account was claimed by a concurrent request — caller retries next slot
  if (!updated) return null;

  return { email: acct.email, password: acct.password };
}

/**
 * Complete an order: deliver credentials, update DB, send confirmation email.
 *
 * Handles all three product types:
 *  - single  → marks product sold, delivers email+password
 *  - shared  → does NOT mark product sold (reusable), delivers email+password
 *  - bulk    → atomically claims qty accounts, delivers array of credentials
 *
 * Idempotent: already-completed orders are silently skipped.
 */
export async function completeOrder(
  orderId: string,
  extraUpdates?: Record<string, unknown>
): Promise<void> {
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order || order.status === 'completed') return;

  const product = await Product.findById(order.productId).select(
    '+accountEmail +accountPassword +accountInstructions'
  );
  if (!product) return;

  const qty = order.quantity ?? 1;

  // ── Bulk ──────────────────────────────────────────────────────────────────
  if (product.productType === 'bulk') {
    const claimed: { email: string; password: string }[] = [];

    for (let i = 0; i < qty; i++) {
      const acct = await claimOneBulkAccount(String(product._id));
      if (acct) claimed.push(acct);
    }

    if (claimed.length === 0) {
      // Stock exhausted — shouldn't happen if checkout validates stock first
      await Order.findByIdAndUpdate(orderId, { status: 'failed', ...extraUpdates });
      return;
    }

    // Mark product sold-out if no remaining unsold accounts
    const stillInStock = await Product.exists({ _id: product._id, 'accounts.sold': false });
    if (!stillInStock) {
      await Product.findByIdAndUpdate(product._id, { isSold: true });
    }

    await Order.findByIdAndUpdate(orderId, {
      status: 'completed',
      deliveredAccounts: claimed,
      ...extraUpdates,
    });

    sendBulkOrderConfirmation(order.buyerEmail, {
      productTitle: product.title,
      amount: order.amount,
      currency: order.currency,
      accounts: claimed,
      instructions: product.accountInstructions,
      orderId,
    }).catch((err) => console.error('Bulk email error:', err));

  // ── Single / Shared ───────────────────────────────────────────────────────
  } else {
    // Only permanently mark sold for 'single'; 'shared' stays available
    if (!product.productType || product.productType === 'single') {
      await Product.findByIdAndUpdate(product._id, { isSold: true });
    }

    await Order.findByIdAndUpdate(orderId, {
      status: 'completed',
      deliveryDetails: {
        email: product.accountEmail,
        password: product.accountPassword,
        instructions: product.accountInstructions,
      },
      ...extraUpdates,
    });

    sendOrderConfirmation(order.buyerEmail, {
      productTitle: product.title,
      amount: order.amount,
      currency: order.currency,
      accountEmail: product.accountEmail,
      accountPassword: product.accountPassword,
      instructions: product.accountInstructions,
      orderId,
    }).catch((err) => console.error('Email error:', err));
  }
}
