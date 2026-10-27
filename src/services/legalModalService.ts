export type LegalModalType =
  | 'terms'
  | 'privacy'
  | 'cookies'
  | 'consumer'
  | 'accessibility'
  | 'jobs';

type Listener = (type: LegalModalType | null) => void;
const listeners = new Set<Listener>();

export const openLegalModal = (type: LegalModalType) => {
  listeners.forEach((listener) => listener(type));
};

export const closeLegalModal = () => {
  listeners.forEach((listener) => listener(null));
};

export const subscribeLegalModal = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
  timestamp: number;
}

const COOKIE_STORAGE_KEY = 'turnosya_cookies_consent';

export const getStoredCookiePreferences = (): CookiePreferences | null => {
  try {
    const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveCookiePreferences = (prefs: Partial<CookiePreferences>) => {
  const finalPrefs: CookiePreferences = {
    essential: true, // Always required
    analytics: prefs.analytics ?? true,
    preferences: prefs.preferences ?? true,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(finalPrefs));
  } catch (e) {
    console.error('Error saving cookie preferences', e);
  }
  // Dispatch an event so banner or other components know consent changed
  window.dispatchEvent(new Event('turnosya_cookies_updated'));
  return finalPrefs;
};
