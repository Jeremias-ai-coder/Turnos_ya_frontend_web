import React, { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import {
  getStoredCookiePreferences,
  saveCookiePreferences,
  openLegalModal,
} from '../services/legalModalService';

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = getStoredCookiePreferences();
    if (!consent) {
      // Small timeout for smooth entrance animation after initial page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }

    const handleCookiesUpdated = () => {
      const updated = getStoredCookiePreferences();
      if (updated) {
        setIsVisible(false);
      }
    };

    window.addEventListener('turnosya_cookies_updated', handleCookiesUpdated);
    return () => {
      window.removeEventListener('turnosya_cookies_updated', handleCookiesUpdated);
    };
  }, []);

  const handleAcceptAll = () => {
    saveCookiePreferences({
      analytics: true,
      preferences: true,
    });
    setIsVisible(false);
  };

  const handleOpenConfigure = () => {
    openLegalModal('cookies');
  };

  const handleOpenPrivacy = (e: React.MouseEvent) => {
    e.preventDefault();
    openLegalModal('privacy');
  };

  if (!isVisible) return null;

  return (
    <aside
      className="cookie-banner-bar"
      role="region"
      aria-label="Aviso de consentimiento de cookies"
    >
      <div className="container cookie-banner-inner">
        <div className="cookie-banner-text-group">
          <div className="cookie-banner-icon">
            <Cookie size={20} />
          </div>
          <p className="cookie-banner-text">
            Usamos cookies para mejorar tu experiencia en Turnos Ya.{' '}
            <button
              type="button"
              onClick={handleOpenPrivacy}
              className="cookie-banner-link"
              title="Consultar Política de Privacidad"
            >
              Consultar más en nuestro Centro de Privacidad.
            </button>
          </p>
        </div>

        <div className="cookie-banner-actions">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="cookie-btn cookie-btn-accept"
          >
            Aceptar cookies
          </button>
          <button
            type="button"
            onClick={handleOpenConfigure}
            className="cookie-btn cookie-btn-configure"
          >
            Configurar cookies
          </button>
        </div>
      </div>
    </aside>
  );
};
