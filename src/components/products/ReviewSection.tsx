'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { StarRating, StarDisplay } from './StarRating';
import { useI18n } from '@/lib/i18n';

interface Review {
  _id: string;
  buyerEmail: string;
  rating: number;
  textEn: string;
  textAr?: string;
  isVerifiedBuyer: boolean;
  createdAt: string;
}

interface Props {
  productId: string;
}

export function ReviewSection({ productId }: Props) {
  const { data: session } = useSession();
  const { t, lang } = useI18n();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [textEn, setTextEn] = useState('');
  const [textAr, setTextAr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setAverage(data.average ?? 0);
      setCount(data.count ?? 0);
    } catch {}
    setLoading(false);
  }, [productId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!textEn.trim()) { toast.error('Please write your review in English'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, textEn, textAr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(t('reviews.success'));
      setTextEn('');
      setTextAr('');
      setRating(5);
      setShowForm(false);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || t('reviews.error'));
    } finally {
      setSubmitting(false);
    }
  }

  // Mask email: user@example.com → u***@example.com
  function maskEmail(email: string) {
    const [local, domain] = email.split('@');
    return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 4))}@${domain}`;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-white font-semibold text-lg">{t('reviews.title')}</h3>
          {count > 0 && (
            <div className="mt-1">
              <StarDisplay value={average} count={count} />
              <span className="text-gray-500 text-xs ml-1">{t('reviews.outOf')}</span>
            </div>
          )}
        </div>
        {session && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t('reviews.writeReview')}
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && session && (
        <form onSubmit={handleSubmit} className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('reviews.yourRating')}</label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">{t('reviews.yourReview')}</label>
            <textarea
              value={textEn}
              onChange={(e) => setTextEn(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder={t('reviews.placeholder')}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm resize-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">{t('reviews.yourReviewAr')}</label>
            <textarea
              value={textAr}
              onChange={(e) => setTextAr(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder={t('reviews.placeholderAr')}
              dir="rtl"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm resize-none transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              {submitting ? t('reviews.submitting') : t('reviews.submit')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-white text-sm px-4 py-2.5 rounded-lg bg-gray-800 transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </form>
      )}

      {!session && (
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 mb-5 text-center">
          <p className="text-gray-500 text-sm">{t('reviews.loginRequired')}</p>
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="text-center py-8 text-gray-600 text-sm">{t('common.loading')}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">{t('reviews.noReviews')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const displayText = lang === 'ar' && review.textAr ? review.textAr : review.textEn;
            return (
              <div key={review._id} className="border-t border-gray-800 pt-4 first:border-0 first:pt-0">
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <StarRating value={review.rating} readonly size="sm" />
                      {review.isVerifiedBuyer && (
                        <span className="text-emerald-400 text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                          {t('reviews.verifiedBuyer')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs mt-1">
                      {maskEmail(review.buyerEmail)} ·{' '}
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{displayText}</p>
                {lang === 'ar' && review.textAr && review.textEn && (
                  <p className="text-gray-600 text-xs mt-1 italic">{review.textEn}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
