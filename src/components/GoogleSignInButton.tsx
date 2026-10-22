import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { X, ExternalLink, Sparkles, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
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
  const [authErrorDetail, setAuthErrorDetail] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const tokenClientRef = useRef<any>(null);

  const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleClientId = typeof rawClientId === 'string' ? rawClientId.replace(/['"\r\n\t\s]+/g, '').trim() : '';

  // Carga del script oficial de Google Identity Services y configuración con select_account forzado
  useEffect(() => {
    if (!googleClientId) return;

    const scriptId = 'google-gsi-client-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initializeClient = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          // Desactivar auto-selección en cookies para que no quede retenida una cuenta previa
          window.google.accounts.id?.disableAutoSelect?.();

          // Inicializar Token Client con prompt: 'select_account' para OBLIGAR a mostrar el selector de cuentas
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'email profile openid',
            prompt: 'select_account',
            callback: handleOAuthResponse,
            error_callback: (nonOAuthErr: any) => {
              console.error('Error inicializando Google OAuth:', nonOAuthErr);
            },
          });
        } catch (err) {
          console.error('Error al configurar Google OAuth Client:', err);
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeClient;
      document.body.appendChild(script);
    } else if (window.google?.accounts?.oauth2) {
      initializeClient();
    }
  }, [googleClientId]);

  const handleOAuthResponse = async (response: any) => {
    if (response.error) {
      setLoading(false);
      if (response.error === 'popup_closed_by_user') {
        // El usuario cerró la ventana emergente intencionalmente
        return;
      }

      let errorMsg = 'Error en la autenticación de Google';
      if (response.error === 'access_denied') {
        errorMsg = 'Acceso bloqueado (403): Tu cuenta de Google no está autorizada como "Usuario de prueba" en Google Cloud Console, o cancelaste el acceso.';
      } else if (response.error === 'redirect_uri_mismatch' || response.error === 'origin_mismatch') {
        errorMsg = 'Error de origen OAuth: Este dominio u origen (localhost / vercel) debe agregarse en "Orígenes autorizados de JavaScript" en Google Cloud Console.';
      } else {
        errorMsg = `Error de Google OAuth: ${response.error_description || response.error}`;
      }

      setAuthErrorDetail(errorMsg);
      onError?.(errorMsg);
      setShowConfigModal(true);
      return;
    }

    setLoading(true);
    try {
      // 1. Obtener la información del usuario directamente desde la API oficial de Google
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${response.access_token}`,
        },
      });

      if (!userInfoRes.ok) {
        throw new Error('No se pudo validar el perfil en Google. Inténtalo de nuevo.');
      }

      const userInfo = await userInfoRes.json();

      // 2. Enviar el access_token y los datos de Google a nuestro backend
      const res = await api.post('/auth/google', {
        accessToken: response.access_token,
        email: userInfo.email,
        name: userInfo.name || userInfo.given_name || userInfo.email?.split('@')[0],
        googleId: userInfo.sub,
      });

      login(res.data.token, res.data.user);
      onSuccess?.();
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al autenticar con Google en el servidor';
      setAuthErrorDetail(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    setAuthErrorDetail(null);

    // Si aún no hay Client ID de Google configurado, abrimos modal informativo con opción demo
    if (!googleClientId) {
      setShowConfigModal(true);
      return;
    }

    // Si el cliente OAuth2 de Google está listo
    if (tokenClientRef.current) {
      setLoading(true);
      try {
        // Asegurar que no haya estado residual y forzar 'select_account' para elegir cualquier cuenta
        window.google.accounts.id?.disableAutoSelect?.();
        tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
      } catch (err: any) {
        setLoading(false);
        const msg = err?.message || 'Error al abrir selector de cuentas de Google';
        setAuthErrorDetail(msg);
        onError?.(msg);
        setShowConfigModal(true);
      }
    } else {
      // El script aún se está descargando o falló la conexión con accounts.google.com
      setLoading(true);
      setTimeout(() => {
        if (tokenClientRef.current) {
          tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
        } else {
          setLoading(false);
          setShowConfigModal(true);
        }
      }, 700);
    }
  };

  const handleDemoGoogleLogin = async () => {
    setLoading(true);
    setShowConfigModal(false);
    setAuthErrorDetail(null);
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
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            padding: '11px 16px',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(60,64,67,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            width: '100%',
          }}
          onMouseEnter={e => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(60,64,67,0.18)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(60,64,67,0.08)';
          }}
        >
          {loading ? (
            <LoadingSpinner size="sm" inline text="Abriendo Google..." color="#4285F4" />
          ) : (
            <>
              <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
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

        {/* Botón sutil de ayuda o modo Demo en caso de trabas con credenciales en Google Cloud */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'underline',
              padding: '2px 4px',
            }}
          >
            <Sparkles size={12} color="#0284c7" />
            ¿Problemas con Google? Probar Demo o ver solución
          </button>
        </div>
      </div>

      {/* Modal interactivo de diagnóstico y solución de Google OAuth */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div
            className="modal-box"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '520px', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: authErrorDetail ? '#fee2e2' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {authErrorDetail ? <AlertCircle size={18} color="#dc2626" /> : <KeyRound size={18} color="#0284c7" />}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-title)' }}>
                  {authErrorDetail ? 'Diagnóstico de Google OAuth' : 'Autenticación con Google'}
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {authErrorDetail && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '0.86rem',
                  color: '#991b1b',
                  marginBottom: '1rem',
                  lineHeight: 1.45,
                }}
              >
                <strong>Detalle del error reportado por Google:</strong>
                <div style={{ marginTop: '4px', wordBreak: 'break-word' }}>{authErrorDetail}</div>
              </div>
            )}

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '0.84rem',
                color: '#334155',
                marginBottom: '1.25rem',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>
                ¿Por qué Google rechaza la cuenta o tira error de OAuth?
              </div>
              <ol style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>App en estado "En prueba" (Testing):</strong> Google bloquea por defecto cualquier cuenta que no esté en la lista de <em>"Usuarios de prueba"</em>. En{' '}
                  <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                    Google Cloud Console → Pantalla de consentimiento de OAuth <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
                  </a>{' '}
                  agrega el correo exacto de Gmail con el que quieres iniciar sesión.
                </li>
                <li>
                  <strong>Orígenes autorizados de JavaScript:</strong> En tus credenciales de OAuth, asegúrate de autorizar:
                  <div style={{ marginTop: '4px', fontFamily: 'monospace', background: '#ffffff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    http://localhost:5173 <br />
                    https://turnos-ya-frontend-web-delta.vercel.app
                  </div>
                </li>
              </ol>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleButtonClick}
                className="btn btn-outline btn-full"
                style={{ padding: '10px 14px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <RefreshCw size={16} /> Reintentar y elegir otra cuenta
              </button>

              <button
                type="button"
                onClick={handleDemoGoogleLogin}
                className="btn btn-primary btn-full"
                style={{ padding: '10px 14px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Sparkles size={16} /> Continuar con cuenta Demo de Google
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
