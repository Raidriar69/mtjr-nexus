'use client';
import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

/**
 * Sets dir="rtl"/lang="ar" on the <html> element when Arabic is selected.
 * Must be rendered inside I18nProvider.
 */
export function DirectionSetter() {
  const { lang } = useI18n();

  useEffect(() => {
    const html = document.documentElement;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    html.lang = lang;
  }, [lang]);

  return null;
}
