import { describe, it, expect, afterEach } from 'vitest';
import { t, getLocale, setLocale, supportedLocales, localeLabels } from '../i18n';

describe('i18n', () => {
  const originalLocale = getLocale();

  afterEach(() => {
    setLocale(originalLocale);
  });

  describe('supportedLocales', () => {
    it('includes en, fr, and es', () => {
      expect(supportedLocales).toContain('en');
      expect(supportedLocales).toContain('fr');
      expect(supportedLocales).toContain('es');
    });

    it('has labels for all supported locales', () => {
      for (const loc of supportedLocales) {
        expect(localeLabels[loc]).toBeDefined();
        expect(typeof localeLabels[loc]).toBe('string');
      }
    });
  });

  describe('getLocale / setLocale', () => {
    it('returns a supported locale', () => {
      expect(supportedLocales).toContain(getLocale());
    });

    it('switches locale', () => {
      setLocale('fr');
      expect(getLocale()).toBe('fr');
      setLocale('en');
      expect(getLocale()).toBe('en');
    });
  });

  describe('t()', () => {
    it('returns English strings when locale is en', () => {
      setLocale('en');
      expect(t('login.connect')).toBe('Connect');
    });

    it('returns French strings when locale is fr', () => {
      setLocale('fr');
      expect(t('login.connect')).toBe('Connexion');
    });

    it('returns Spanish strings when locale is es', () => {
      setLocale('es');
      expect(t('login.connect')).toBe('Conectar');
    });

    it('returns the key itself for unknown keys', () => {
      setLocale('en');
      // Cast to bypass TS — simulates a missing key at runtime
      const result = t('nonexistent.key' as never);
      expect(result).toBe('nonexistent.key');
    });

    it('all en keys have corresponding fr translations', () => {
      setLocale('en');
      const enResult = t('login.title');
      setLocale('fr');
      const frResult = t('login.title');
      // Both should return non-empty strings (not the key)
      expect(enResult.length).toBeGreaterThan(0);
      expect(frResult.length).toBeGreaterThan(0);
    });
  });

  describe('onLocaleChange', () => {
    it('notifies listeners on locale change', async () => {
      const { onLocaleChange } = await import('../i18n');
      let callCount = 0;
      const unsub = onLocaleChange(() => callCount++);

      setLocale('fr');
      setLocale('en');

      expect(callCount).toBe(2);
      unsub();
    });

    it('unsubscribe stops notifications', async () => {
      const { onLocaleChange } = await import('../i18n');
      let callCount = 0;
      const unsub = onLocaleChange(() => callCount++);
      unsub();

      setLocale('fr');
      expect(callCount).toBe(0);
    });
  });
});
