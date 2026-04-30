'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Product, GAME_CATEGORIES } from '@/types';

interface BulkAccount {
  _id?: string;
  email: string;
  password: string;
  /** Lifecycle: available → reserved → sold */
  status: 'available' | 'reserved' | 'sold';
  orderId?: string;
}

interface ProductFormProps {
  initialData?: Partial<Product> & { accounts?: BulkAccount[]; productType?: string };
  productId?: string;
}

const emptyForm = {
  game: '',
  title: '',
  description: '',
  rank: '',
  level: 0,
  skins: '',
  items: '',
  price: '',
  originalPrice: '',
  images: '',
  category: 'other',
  platform: 'PC',
  productType: 'single',
  deliveryMethod: 'email_password',
  accountEmail: '',
  accountPassword: '',
  accountInstructions: '',
  isFeatured: false,
  bulkEmails: '',
  bulkPasswords: '',
};

// ── Account status styling ────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { dot: string; text: string; label: string }> = {
  available: { dot: 'bg-emerald-400',  text: 'text-white',       label: 'Available' },
  reserved:  { dot: 'bg-amber-400',    text: 'text-amber-200',   label: 'Reserved'  },
  sold:      { dot: 'bg-gray-600',     text: 'text-gray-500',    label: 'Sold'      },
};

function getStatus(a: BulkAccount): 'available' | 'reserved' | 'sold' {
  // Handle legacy documents that may not have the status field
  if (a.status) return a.status;
  return 'available'; // legacy default
}

export function ProductForm({ initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);

  // Normalise existing accounts — handle legacy `sold` boolean field from old documents
  const existingAccounts: BulkAccount[] = (initialData?.accounts ?? []).map((a: any) => ({
    _id: a._id,
    email: a.email,
    password: a.password,
    status: a.status ?? (a.sold ? 'sold' : 'available'),
    orderId: a.orderId,
  }));

  const countAvailable = existingAccounts.filter((a) => getStatus(a) === 'available').length;
  const countReserved  = existingAccounts.filter((a) => getStatus(a) === 'reserved').length;
  const countSold      = existingAccounts.filter((a) => getStatus(a) === 'sold').length;

  const [form, setForm] = useState({
    ...emptyForm,
    ...initialData,
    productType: (initialData?.productType as string) ?? 'single',
    skins: initialData?.skins?.join(', ') ?? '',
    items: initialData?.items?.join(', ') ?? '',
    images: initialData?.images?.join('\n') ?? '',
    price: initialData?.price?.toString() ?? '',
    originalPrice: initialData?.originalPrice?.toString() ?? '',
    bulkEmails: '',
    bulkPasswords: '',
  });

  const isEditing = Boolean(productId);
  const isBulk = form.productType === 'bulk';

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  // Validate & parse the bulk account textareas
  function parseBulkAccounts(): Omit<BulkAccount, '_id'>[] | null {
    const emails = (form.bulkEmails as string)
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const passwords = (form.bulkPasswords as string)
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (emails.length === 0 && passwords.length === 0) return [];

    if (emails.length !== passwords.length) {
      toast.error(`Email count (${emails.length}) ≠ password count (${passwords.length}). Fix and try again.`);
      return null;
    }

    return emails.map((email, i) => ({
      email,
      password: passwords[i],
      status: 'available' as const,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // ── Build base payload ──────────────────────────────────────
    const base = {
      game: form.game,
      title: form.title,
      description: form.description,
      rank: form.rank,
      level: Number(form.level),
      skins: form.skins ? (form.skins as string).split(',').map((s) => s.trim()).filter(Boolean) : [],
      items: form.items ? (form.items as string).split(',').map((s) => s.trim()).filter(Boolean) : [],
      price: parseFloat(form.price as string),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice as string) : undefined,
      images: form.images ? (form.images as string).split('\n').map((s) => s.trim()).filter(Boolean) : [],
      category: form.category,
      platform: form.platform,
      productType: form.productType,
      isFeatured: form.isFeatured,
    };

    let payload: Record<string, unknown> = { ...base };

    if (isBulk) {
      // ── Bulk ──────────────────────────────────────────────────
      const parsed = parseBulkAccounts();
      if (parsed === null) { setLoading(false); return; }

      if (isEditing) {
        // Editing: append new accounts only if textareas were filled
        if (parsed.length > 0) {
          payload.appendAccounts = parsed;
        }
        payload.deliveryMethod = 'email_password';
        payload.accountEmail = '';
        payload.accountPassword = '';
        payload.accountInstructions = form.accountInstructions;
      } else {
        // Creating: must provide at least 1 account
        if (parsed.length === 0) {
          toast.error('Please add at least one account (email & password).');
          setLoading(false);
          return;
        }
        payload.accounts = parsed;
        payload.deliveryMethod = 'email_password';
        payload.accountEmail = '';
        payload.accountPassword = '';
        payload.accountInstructions = form.accountInstructions;
      }
    } else {
      // ── Single / Shared ──────────────────────────────────────
      payload.deliveryMethod = form.deliveryMethod;
      payload.accountEmail = form.accountEmail;
      payload.accountPassword = form.accountPassword;
      payload.accountInstructions = form.accountInstructions;
    }

    try {
      const url = isEditing ? `/api/admin/products/${productId}` : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      toast.success(isEditing ? 'Product updated!' : 'Product created!');
      router.push('/admin/products');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const field = (label: string, name: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={(form as any)[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('Game Title', 'game', 'text', 'e.g. Fortnite')}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
          >
            {GAME_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {field('Listing Title', 'title', 'text', 'e.g. Fortnite OG Account — 150+ Skins')}

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          placeholder="Describe the account in detail..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {field('Price (USD)', 'price', 'number', '29.99')}
        {field('Original Price (optional)', 'originalPrice', 'number', '49.99')}
        {field('Rank', 'rank', 'text', 'e.g. Diamond II')}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('Skins (comma-separated)', 'skins', 'text', 'Renegade Raider, Ghoul Trooper')}
        {field('Items (comma-separated)', 'items', 'text', 'Galaxy Pickaxe, OG Shield')}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Image URLs (one per line)</label>
        <textarea
          name="images"
          value={form.images as string}
          onChange={handleChange}
          rows={3}
          placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm resize-none"
        />
      </div>

      {/* ── Product Type + Platform ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Product Type</label>
          <select
            name="productType"
            value={form.productType}
            onChange={handleChange}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
          >
            <option value="single">Single Account (One-Time Sale)</option>
            <option value="shared">Shared Account (Reusable)</option>
            <option value="bulk">Bulk Accounts (Multi-Stock)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Platform</label>
          <select
            name="platform"
            value={form.platform}
            onChange={handleChange}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
          >
            {['PC', 'PlayStation', 'Xbox', 'Mobile', 'All Platforms'].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        {!isBulk && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Delivery Method</label>
            <select
              name="deliveryMethod"
              value={form.deliveryMethod}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
            >
              <option value="email_password">Email & Password</option>
              <option value="account_transfer">Account Transfer</option>
            </select>
          </div>
        )}
      </div>

      {/* ── Delivery Details: Single / Shared ── */}
      {!isBulk && (
        <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-5 space-y-4">
          <h3 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
            🔐 Private Delivery Details (encrypted, sent to buyer only)
          </h3>
          {field('Account Email', 'accountEmail', 'email', 'account@example.com')}
          {field('Account Password', 'accountPassword', 'text', 'StrongPassword123')}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Additional Instructions</label>
            <textarea
              name="accountInstructions"
              value={form.accountInstructions}
              onChange={handleChange}
              rows={2}
              placeholder="e.g. Change password immediately after logging in."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm resize-none"
            />
          </div>
        </div>
      )}

      {/* ── Delivery Details: Bulk ── */}
      {isBulk && (
        <div className="bg-gray-900 border border-violet-500/30 rounded-xl p-5 space-y-4">

          {/* Header + stock summary pill */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-violet-400 font-semibold text-sm">📦 Bulk Account Stock</h3>
            {isEditing && existingAccounts.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full px-2.5 py-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {countAvailable} available
                </span>
                {countReserved > 0 && (
                  <span className="flex items-center gap-1.5 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full px-2.5 py-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    {countReserved} reserved
                  </span>
                )}
                {countSold > 0 && (
                  <span className="flex items-center gap-1.5 text-xs bg-gray-700/50 border border-gray-600/30 text-gray-500 rounded-full px-2.5 py-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 inline-block" />
                    {countSold} sold
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowAccounts((v) => !v)}
                  className="text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 bg-violet-500/10 rounded-full px-2.5 py-1 transition-colors font-medium"
                >
                  {showAccounts ? 'Hide list' : 'View list'}
                </button>
              </div>
            )}
          </div>

          {/* ── Color-coded account list ── */}
          {isEditing && existingAccounts.length > 0 && showAccounts && (
            <div className="rounded-xl border border-gray-700 overflow-hidden">
              {/* Legend */}
              <div className="flex items-center gap-4 px-4 py-2.5 bg-gray-800/80 border-b border-gray-700 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Available</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Reserved (awaiting confirmation)</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-600" />Sold</span>
              </div>
              {/* Scrollable list */}
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-800/60">
                {existingAccounts.map((acct, idx) => {
                  const st = getStatus(acct);
                  const style = STATUS_STYLE[st] ?? STATUS_STYLE.available;
                  return (
                    <div
                      key={acct._id ?? idx}
                      className={`flex items-center gap-3 px-4 py-2.5 text-xs font-mono ${
                        st === 'sold' ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Status dot */}
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                      {/* Row number */}
                      <span className="text-gray-600 w-6 text-right flex-shrink-0">{idx + 1}</span>
                      {/* Email */}
                      <span className={`flex-1 min-w-0 truncate ${style.text}`}>{acct.email}</span>
                      {/* Password (masked) */}
                      <span className="text-gray-600 flex-shrink-0">{'•'.repeat(Math.min(acct.password?.length ?? 8, 10))}</span>
                      {/* Status badge */}
                      <span className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider ${
                        st === 'available' ? 'text-emerald-500' :
                        st === 'reserved'  ? 'text-amber-400'   :
                                             'text-gray-600'
                      }`}>
                        {style.label}
                        {st === 'reserved' && acct.orderId && (
                          <span className="ml-1 text-gray-600 normal-case tracking-normal">
                            #{acct.orderId.slice(-6)}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-gray-500 text-xs">
            {isEditing
              ? 'Leave blank to keep existing accounts. Fill in to add more to stock.'
              : 'One email per line, one password per line — counts must match.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Emails {isEditing ? '(new, to append)' : '(required)'}
              </label>
              <textarea
                name="bulkEmails"
                value={form.bulkEmails as string}
                onChange={handleChange}
                rows={8}
                placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm resize-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Passwords {isEditing ? '(new, to append)' : '(required)'}
              </label>
              <textarea
                name="bulkPasswords"
                value={form.bulkPasswords as string}
                onChange={handleChange}
                rows={8}
                placeholder="Password123!&#10;SecurePass456@&#10;MyPass789#"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm resize-none font-mono"
              />
            </div>
          </div>

          {/* Live count display */}
          {(() => {
            const emailCount = (form.bulkEmails as string)
              .split('\n').map((s) => s.trim()).filter(Boolean).length;
            const passCount = (form.bulkPasswords as string)
              .split('\n').map((s) => s.trim()).filter(Boolean).length;
            if (emailCount === 0 && passCount === 0) return null;
            const match = emailCount === passCount;
            return (
              <div className={`text-xs rounded-lg px-3 py-2 flex items-center gap-2 ${
                match ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {match ? '✓' : '✗'}
                {emailCount} emails · {passCount} passwords
                {!match && ' — counts must match'}
                {match && isEditing && ` — will add ${emailCount} new account${emailCount !== 1 ? 's' : ''}`}
              </div>
            );
          })()}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Additional Instructions (optional)</label>
            <textarea
              name="accountInstructions"
              value={form.accountInstructions}
              onChange={handleChange}
              rows={2}
              placeholder="e.g. Change password immediately after logging in."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm resize-none"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isFeatured"
          name="isFeatured"
          checked={form.isFeatured as boolean}
          onChange={handleChange}
          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-violet-500 focus:ring-violet-500"
        />
        <label htmlFor="isFeatured" className="text-gray-400 text-sm">Mark as Featured</label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {isEditing ? 'Update Product' : 'Create Product'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/products')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
