'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'en' | 'ar';

// ── Translations ─────────────────────────────────────────────────────────────
const translations = {
  en: {
    nav: {
      allAccounts: 'All Accounts',
      cart: 'Cart',
      myOrders: 'My Orders',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      admin: 'Admin',
    },
    product: {
      buyNow: 'Buy Now',
      addToCart: 'Add to Cart',
      inCart: 'In Cart',
      outOfStock: 'Out of Stock',
      soldOut: 'Account Sold',
      inStock: 'in stock',
      quantity: 'Quantity',
      total: 'Total',
      featured: 'Featured',
      rank: 'Rank',
      level: 'Level',
      platform: 'Platform',
      skins: 'Skins',
      items: 'Items',
      description: 'Description',
      includedContent: 'Included Content',
      instantDelivery: 'Instant delivery after payment',
      paypalCrypto: 'PayPal & Crypto accepted',
      refundPolicy: 'Read our refund policy before purchasing',
      disclaimer: "Purchasing gaming accounts may violate the game's Terms of Service. MTJR Nexus is not responsible for account bans. All sales are final.",
      buyerDisclaimer: '⚠️ Buyer Disclaimer',
    },
    checkout: {
      title: 'Payment',
      breadcrumbCart: 'Cart',
      breadcrumbCheckout: 'Checkout',
      emailLabel: '📧 Email for order receipt & credentials',
      paypal: 'PayPal',
      crypto: 'Crypto',
      proceedCrypto: 'Pay',
      orderSummary: 'Order Summary',
      items: 'item',
      itemsPlural: 'items',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery fee',
      free: 'Free',
      totalLabel: 'Total',
      instantDelivery: '⚡ Instant credential delivery after payment',
      emailDelivery: '📧 Account details sent to your email',
      encrypted: '🔒 Encrypted & secure transaction',
      warningTitle: '⚠️ Before You Pay — Important!',
      warningText: 'Please record a video during the login process to verify whether the account is working. This video serves as proof in case of any issues with the account.',
      warningAck: 'I understand — I will record a video when logging into the account',
      warningProceed: 'Continue to Payment',
      paypalProtection: '🔒 Secured by PayPal · Buyer Protection included',
      cryptoNote: 'Via NOWPayments · Confirmed on-chain',
      disclaimer: 'Purchasing gaming accounts may violate game ToS. MTJR Nexus is not responsible for bans. All sales are final.',
    },
    success: {
      confirmed: 'Payment Confirmed!',
      processing: 'Payment Processing…',
      sentTo: 'Account details sent to',
      finalising: 'Finalising order for',
      orderDetails: 'Order Details',
      totalPaid: 'Total paid',
      delivered: '✓ Delivered',
      pending: '⏳ Processing',
      credentials: '🔑 Account Credentials',
      reveal: '🔓 Reveal',
      hide: '🔒 Hide',
      account: 'Account',
      email: 'Email',
      password: 'Password',
      changePassword: '⚠️ Change passwords immediately. Never share these credentials.',
      viewOrders: 'View My Orders',
      browseMore: 'Browse More',
      contactNotice: '💬 If you have any problems, contact us via',
      whatsapp: 'WhatsApp',
      or: 'or',
      instagram: 'Instagram',
    },
    orders: {
      title: 'My Purchases',
      subtitle: 'Your purchase history',
      noPurchases: 'No orders yet',
      noPurchasesSubtext: 'Browse our catalog to find your perfect account.',
      statusCompleted: 'Completed',
      statusPending: 'Pending',
      statusFailed: 'Failed',
      statusRefunded: 'Refunded',
      viewOrder: 'View Order →',
      date: 'Date',
      amount: 'Amount',
      paymentMethod: 'Payment Method',
      warningTitle: '⚠️ Action Required Before Viewing',
      warningText: 'You must record a video while logging into the account. This is required as proof in case the account is not working correctly. MTJR Nexus cannot assist you without proof.',
      warningButton: 'I Understand — Show Credentials',
      credentials: 'Account Credentials',
      reveal: '🔓 Reveal',
      hide: '🔒 Hide',
      contactNotice: '💬 Having issues? Contact us via',
      whatsapp: 'WhatsApp',
      or: 'or',
      instagram: 'Instagram',
      orderDetails: 'Order Details',
      orderId: 'Order ID',
      product: 'Product',
      status: 'Status',
      paymentMethodLabel: 'Payment',
      quantity: 'Quantity',
      backToOrders: '← Back to Orders',
      noCredentials: 'Credentials not yet available. Check back shortly.',
      accountNumber: 'Account',
    },
    reviews: {
      title: 'Customer Reviews',
      writeReview: 'Write a Review',
      yourRating: 'Your Rating',
      yourReview: 'Your Review (English)',
      yourReviewAr: 'Your Review (Arabic, optional)',
      placeholder: 'Share your experience with this account…',
      placeholderAr: 'شارك تجربتك (اختياري)…',
      submit: 'Submit Review',
      verifiedBuyer: '✓ Verified Buyer',
      noReviews: 'No reviews yet. Be the first!',
      outOf: 'out of 5',
      ratings: 'ratings',
      onlyVerified: 'Only verified buyers can leave reviews.',
      loginRequired: 'Sign in to leave a review.',
      submitting: 'Submitting…',
      success: 'Review submitted!',
      error: 'Failed to submit review.',
    },
    footer: {
      tagline: 'Premium digital gaming accounts marketplace. Rare skins, high-rank accounts — instant delivery.',
      shop: 'Shop',
      legal: 'Legal',
      contact: 'Contact',
      terms: 'Terms of Service',
      refund: 'Refund Policy',
      disclaimer: 'Disclaimer',
      allAccounts: 'All Accounts',
      rights: 'All rights reserved.',
      secured: 'Payments secured by PayPal & Crypto',
    },
    common: {
      loading: 'Loading…',
      browseAccounts: 'Browse Accounts',
      back: 'Back',
      close: 'Close',
      currency: 'Currency',
      language: 'Language',
      usd: 'USD',
      originalPrice: 'Original Price',
    },
  },

  ar: {
    nav: {
      allAccounts: 'جميع الحسابات',
      cart: 'السلة',
      myOrders: 'طلباتي',
      signIn: 'تسجيل الدخول',
      signUp: 'إنشاء حساب',
      signOut: 'تسجيل الخروج',
      admin: 'الإدارة',
    },
    product: {
      buyNow: 'اشتري الآن',
      addToCart: 'أضف للسلة',
      inCart: 'في السلة',
      outOfStock: 'نفد المخزون',
      soldOut: 'تم البيع',
      inStock: 'متوفر',
      quantity: 'الكمية',
      total: 'المجموع',
      featured: 'مميز',
      rank: 'الرتبة',
      level: 'المستوى',
      platform: 'المنصة',
      skins: 'الأسكنات',
      items: 'العناصر',
      description: 'الوصف',
      includedContent: 'المحتوى المتضمن',
      instantDelivery: 'تسليم فوري بعد الدفع',
      paypalCrypto: 'باي بال والكريبتو مقبولان',
      refundPolicy: 'اقرأ سياسة الاسترداد قبل الشراء',
      disclaimer: 'شراء حسابات الألعاب قد يخالف شروط خدمة اللعبة. MTJR Nexus غير مسؤول عن حظر الحسابات. جميع المبيعات نهائية.',
      buyerDisclaimer: '⚠️ تنبيه للمشتري',
    },
    checkout: {
      title: 'الدفع',
      breadcrumbCart: 'السلة',
      breadcrumbCheckout: 'إتمام الشراء',
      emailLabel: '📧 البريد الإلكتروني لاستلام الطلب والبيانات',
      paypal: 'باي بال',
      crypto: 'كريبتو',
      proceedCrypto: 'ادفع',
      orderSummary: 'ملخص الطلب',
      items: 'منتج',
      itemsPlural: 'منتجات',
      subtotal: 'المجموع الفرعي',
      deliveryFee: 'رسوم التوصيل',
      free: 'مجاني',
      totalLabel: 'الإجمالي',
      instantDelivery: '⚡ تسليم فوري للبيانات بعد الدفع',
      emailDelivery: '📧 تفاصيل الحساب ترسل إلى بريدك',
      encrypted: '🔒 معاملة مشفرة وآمنة',
      warningTitle: '⚠️ قبل الدفع — مهم!',
      warningText: 'يرجى تسجيل فيديو أثناء عملية تسجيل الدخول للتحقق من أن الحساب يعمل. هذا الفيديو هو دليلك في حالة وجود أي مشكلة مع الحساب.',
      warningAck: 'أفهم — سأسجل فيديو عند تسجيل الدخول للحساب',
      warningProceed: 'متابعة للدفع',
      paypalProtection: '🔒 مؤمن بواسطة باي بال · حماية المشتري متضمنة',
      cryptoNote: 'عبر NOWPayments · مؤكد على البلوكتشين',
      disclaimer: 'شراء حسابات الألعاب قد يخالف الشروط. MTJR Nexus غير مسؤول عن الحظر. جميع المبيعات نهائية.',
    },
    success: {
      confirmed: 'تم تأكيد الدفع!',
      processing: 'جار معالجة الدفع…',
      sentTo: 'تفاصيل الحساب أُرسلت إلى',
      finalising: 'جار إتمام الطلب لـ',
      orderDetails: 'تفاصيل الطلب',
      totalPaid: 'إجمالي المدفوع',
      delivered: '✓ تم التسليم',
      pending: '⏳ قيد المعالجة',
      credentials: '🔑 بيانات الحساب',
      reveal: '🔓 إظهار',
      hide: '🔒 إخفاء',
      account: 'حساب',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      changePassword: '⚠️ غيّر كلمة المرور فوراً. لا تشارك هذه البيانات.',
      viewOrders: 'عرض طلباتي',
      browseMore: 'تصفح المزيد',
      contactNotice: '💬 إذا واجهت أي مشكلة، تواصل معنا عبر',
      whatsapp: 'واتساب',
      or: 'أو',
      instagram: 'إنستغرام',
    },
    orders: {
      title: 'مشترياتي',
      subtitle: 'سجل مشترياتك',
      noPurchases: 'لا توجد طلبات بعد',
      noPurchasesSubtext: 'تصفح كتالوجنا للعثور على حسابك المثالي.',
      statusCompleted: 'مكتمل',
      statusPending: 'معلق',
      statusFailed: 'فاشل',
      statusRefunded: 'مسترد',
      viewOrder: 'عرض الطلب ←',
      date: 'التاريخ',
      amount: 'المبلغ',
      paymentMethod: 'طريقة الدفع',
      warningTitle: '⚠️ إجراء مطلوب قبل عرض البيانات',
      warningText: 'يجب عليك تسجيل فيديو أثناء تسجيل الدخول إلى الحساب. هذا مطلوب كدليل في حالة عدم عمل الحساب بشكل صحيح. لا يمكن لـ MTJR Nexus مساعدتك بدون دليل.',
      warningButton: 'فهمت — أظهر البيانات',
      credentials: 'بيانات الحساب',
      reveal: '🔓 إظهار',
      hide: '🔒 إخفاء',
      contactNotice: '💬 هل لديك مشكلة؟ تواصل معنا عبر',
      whatsapp: 'واتساب',
      or: 'أو',
      instagram: 'إنستغرام',
      orderDetails: 'تفاصيل الطلب',
      orderId: 'رقم الطلب',
      product: 'المنتج',
      status: 'الحالة',
      paymentMethodLabel: 'طريقة الدفع',
      quantity: 'الكمية',
      backToOrders: '→ العودة للطلبات',
      noCredentials: 'البيانات غير متاحة بعد. تحقق لاحقاً.',
      accountNumber: 'حساب',
    },
    reviews: {
      title: 'تقييمات العملاء',
      writeReview: 'اكتب تقييماً',
      yourRating: 'تقييمك',
      yourReview: 'تقييمك (بالإنجليزية)',
      yourReviewAr: 'تقييمك (بالعربية، اختياري)',
      placeholder: 'شارك تجربتك مع هذا الحساب…',
      placeholderAr: 'أضف تقييمك بالعربية (اختياري)…',
      submit: 'إرسال التقييم',
      verifiedBuyer: '✓ مشتري موثق',
      noReviews: 'لا توجد تقييمات بعد. كن الأول!',
      outOf: 'من 5',
      ratings: 'تقييم',
      onlyVerified: 'فقط المشترين الموثقين يمكنهم ترك تقييم.',
      loginRequired: 'سجل الدخول لترك تقييم.',
      submitting: 'جار الإرسال…',
      success: 'تم إرسال التقييم!',
      error: 'فشل إرسال التقييم.',
    },
    footer: {
      tagline: 'سوق حسابات الألعاب الرقمية المميزة. أسكنات نادرة وحسابات عالية الرتبة — تسليم فوري.',
      shop: 'التسوق',
      legal: 'قانوني',
      contact: 'تواصل معنا',
      terms: 'شروط الخدمة',
      refund: 'سياسة الاسترداد',
      disclaimer: 'إخلاء المسؤولية',
      allAccounts: 'جميع الحسابات',
      rights: 'جميع الحقوق محفوظة.',
      secured: 'المدفوعات مؤمنة بواسطة باي بال والكريبتو',
    },
    common: {
      loading: 'جار التحميل…',
      browseAccounts: 'تصفح الحسابات',
      back: 'رجوع',
      close: 'إغلاق',
      currency: 'العملة',
      language: 'اللغة',
      usd: 'دولار',
      originalPrice: 'السعر الأصلي',
    },
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Translations = typeof translations.en;
type DotPath<T extends object, K extends keyof T = keyof T> = K extends string
  ? T[K] extends object
    ? `${K}.${DotPath<T[K]>}`
    : K
  : never;
export type TranslationKey = DotPath<Translations>;

// ── Context ───────────────────────────────────────────────────────────────────
interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mtjrnexus_lang') as Lang | null;
      if (saved === 'ar' || saved === 'en') setLangState(saved);
    } catch {}
  }, []);

  function setLang(newLang: Lang) {
    setLangState(newLang);
    try { localStorage.setItem('mtjrnexus_lang', newLang); } catch {}
  }

  function t(key: TranslationKey): string {
    const parts = key.split('.');
    let obj: any = translations[lang];
    for (const part of parts) {
      obj = obj?.[part];
      if (obj === undefined) break;
    }
    if (typeof obj === 'string') return obj;
    // Fallback to English
    obj = translations.en;
    for (const part of parts) {
      obj = obj?.[part];
      if (obj === undefined) break;
    }
    return typeof obj === 'string' ? obj : key;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRTL: lang === 'ar' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
