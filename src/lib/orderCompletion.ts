import { connectDB } from './mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { sendOrderConfirmation, sendBulkOrderConfirmation } from './email';

// ── Atomic helpers ─────────────────────────────────────────────────────────────

/**
 * Deliver the already-reserved accounts for an order (reserved → sold).
 * Primary path: admin approves a manual-payment order that reserved stock upfront.
 */
async function deliverReservedAccounts(
  productId: string,
  orderId: string,
  qty: number
): Promise<{ email: string; password: string }[]> {
  const delivered: { email: string; password: string }[] = [];

  for (let i = 0; i < qty; i++) {
    const snapshot = await Product.findOne(
      { _id: productId, 'accounts.status': 'reserved', 'accounts.orderId': orderId },
      { 'accounts.$': 1 } as any
    ).lean() as any;

    if (!snapshot?.accounts?.[0]) break; // no more reserved accounts for this order

    const acct = snapshot.accounts[0];

    const updated = await Product.findOneAndUpdate(
      {
        _id: productId,
        'accounts._id': acct._id,
        'accounts.status': 'reserved',
        'accounts.orderId': orderId,
      },
      { $set: { 'accounts.$.status': 'sold', 'accounts.$.orderId': null } }
    );

    if (updated) {
      delivered.push({ email: acct.email, password: acct.password });
    }
  }

  return delivered;
}

/**
 * Fallback: atomically claim one *available* account (legacy path or first-time claims).
 * Used when no pre-reservation exists — e.g. auto-completed Stripe payments.
 */
async function claimOneAvailableAccount(
  productId: string
): Promise<{ email: string; password: string } | null> {
  const snapshot = await Product.findOne(
    { _id: productId, 'accounts.status': 'available' },
    { 'accounts.$': 1 } as any
  ).lean() as any;

  if (!snapshot?.accounts?.[0]) return null;

  const acct = snapshot.accounts[0];

  const updated = await Product.findOneAndUpdate(
    { _id: productId, 'accounts._id': acct._id, 'accounts.status': 'available' },
    { $set: { 'accounts.$.status': 'sold' } }
  );

  if (!updated) return null;
  return { email: acct.email, password: acct.password };
}

/**
 * Revert reserved → available for all accounts attached to an order.
 * Called on admin rejection of a manual-payment order.
 */
export async function releaseReservedAccounts(
  productId: string,
  orderId: string
): Promise<void> {
  await connectDB();

  await Product.updateMany(
    { _id: productId, 'accounts.orderId': orderId, 'accounts.status': 'reserved' },
    {
      $set: {
        'accounts.$[elem].status': 'available',
        'accounts.$[elem].orderId': null,
      },
    },
    {
      arrayFilters: [{ 'elem.orderId': orderId, 'elem.status': 'reserved' }],
    }
  );

  // If product was marked sold-out, reactivate it (stock is back)
  await Product.findByIdAndUpdate(productId, { isSold: false });
}

// ── Reserve accounts on mark-paid ─────────────────────────────────────────────

/**
 * Atomically reserve `qty` available accounts for the given order.
 * Returns true if all accounts were reserved, false if insufficient stock.
 */
export async function reserveAccountsForOrder(
  productId: string,
  orderId: string,
  qty: number
): Promise<boolean> {
  await connectDB();

  // Quick stock check (non-atomic pre-check to avoid unnecessary loops)
  const product = await Product.findOne({ _id: productId }).lean() as any;
  if (!product || product.productType !== 'bulk') return true; // not bulk — no reservation needed

  const availableCount = (product.accounts ?? []).filter(
    (a: any) => a.status === 'available'
  ).length;

  if (availableCount < qty) return false; // not enough stock

  // Reserve one at a time atomically
  for (let i = 0; i < qty; i++) {
    const updated = await Product.findOneAndUpdate(
      { _id: productId, 'accounts.status': 'available' },
      { $set: { 'accounts.$.status': 'reserved', 'accounts.$.orderId': orderId } }
    );
    if (!updated) return false; // concurrent race ate the last slot
  }

  return true;
}

// ── Main completeOrder ────────────────────────────────────────────────────────

/**
 * Complete an order: deliver credentials, update DB, send confirmation email.
 *
 * Handles all three product types:
 *  - single  → marks product sold, delivers email+password
 *  - shared  → does NOT mark product sold (reusable), delivers email+password
 *  - bulk    → delivers pre-reserved accounts (reserved→sold); falls back to
 *              claiming available if no reservation found (e.g. Stripe flow)
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
    let claimed: { email: string; password: string }[] = [];

    // Primary path: deliver already-reserved accounts
    claimed = await deliverReservedAccounts(String(product._id), orderId, qty);

    // Fallback: claim available accounts (Stripe / legacy path)
    if (claimed.length < qty) {
      const fallbackNeeded = qty - claimed.length;
      for (let i = 0; i < fallbackNeeded; i++) {
        const acct = await claimOneAvailableAccount(String(product._id));
        if (acct) claimed.push(acct);
      }
    }

    if (claimed.length === 0) {
      await Order.findByIdAndUpdate(orderId, { status: 'failed', ...extraUpdates });
      return;
    }

    // Mark product sold-out if no remaining available or reserved accounts for other orders
    const stillInStock = await Product.exists({
      _id: product._id,
      'accounts.status': 'available',
    });
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
