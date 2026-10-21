import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import LoadingSpinner from './common/LoadingSpinner';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  buttonText?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  buttonText = 'Continuar con Google',
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Carga del script oficial de Google Identity Services si hay un CLIENT_ID configurado
  useEffect(() => {
    if (!googleClientId) return;

    const scriptId = 'google-gsi-client-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initializeGsi = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
        });

        if (googleBtnContainerRef.current) {
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: '100%',
            locale: 'es',
          });
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGsi;
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initializeGsi();
    }
  }, [googleClientId]);

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) {
      onError?.('No se recibió la credencial de Google.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/google', { credential: response.credential });
      login(res.data.token, res.data.user);
      onSuccess?.();
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al autenticar con Google';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      // Si aún no está configurado el CLIENT_ID de Google Cloud, mostrar modal informativo con opción demo
      setShowConfigModal(true);
    }
  };

  const handleDemoGoogleLogin = async () => {
    setLoading(true);
    setShowConfigModal(false);
    try {
      const demoEmail = 'usuario.google@gmail.com';
      const demoName = 'Usuario Google';
      const res = await api.post('/auth/google', {
        email: demoEmail,
        name: demoName,
        googleId: 'google-demo-123456789',
      });
      login(res.data.token, res.data.user);
      onSuccess?.();
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al iniciar sesión con Google Demo';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ width: '100%' }}>
        {/* Si el SDK oficial de Google está listo y configurado con client_id, renderiza el botón oficial */}
        {googleClientId ? (
          <div ref={googleBtnContainerRef} style={{ width: '100%', minHeight: '44px' }} />
        ) : (
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={loading}
            className="btn btn-full"
            style={{
              backgroundColor: '#ffffff',
              color: '#3c4043',
              border: '1px solid #dadce0',
              fontWeight: 600,
              fontSize: '0.92rem',
              padding: '10px 16px',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(60,64,67,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? (
              <LoadingSpinner size="sm" inline text="Conectando..." color="var(--primary-color)" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span>{buttonText}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Modal interactivo cuando aún no se ingresó el Client ID de Google Cloud */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div
            className="modal-box"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} color="#dc2626" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-title)' }}>
                  Inicio con Google
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' }}>
              El backend y la arquitectura ya están 100% listos. Para habilitar el pop-up real de Google en producción, solo necesitas crear tu <strong>OAuth 2.0 Client ID</strong> en Google Cloud Console.
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '0.82rem',
                color: '#334155',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Pasos rápidos para producción:</div>
              <ol style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Crear credencial OAuth 2.0 en <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>Google Cloud Console <ExternalLink size={11} style={{ verticalAlign: 'middle' }} /></a>.</li>
                <li>Autorizar el origen: <code>https://turnos-ya-frontend-web-delta.vercel.app</code></li>
                <li>Configurar <code>VITE_GOOGLE_CLIENT_ID</code> en Vercel y tu archivo <code>.env</code>.</li>
              </ol>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleDemoGoogleLogin}
                className="btn btn-primary btn-full"
                style={{ padding: '10px 14px', fontSize: '0.9rem' }}
              >
                <Sparkles size={16} /> Probar inicio con cuenta Demo de Google
              </button>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="btn btn-light btn-full"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
