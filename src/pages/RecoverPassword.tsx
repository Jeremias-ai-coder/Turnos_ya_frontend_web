import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Mail, ArrowLeft, CheckCircle2, Sparkles, KeyRound } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const RecoverPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [qaResetToken, setQaResetToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      if (response.data?.resetToken) {
        setQaResetToken(response.data.resetToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div className="ml-card" style={{ padding: '2.5rem' }}>
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <img
              src="/assets/brand/logo-color.png"
              alt="Turnos Ya"
              style={{ height: '48px', objectFit: 'contain' }}
            />
          </div>

          {!submitted ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <KeyRound size={22} color="var(--primary-color)" />
                <h2 style={{ color: 'var(--text-title)', fontWeight: 800, margin: 0, fontSize: '1.4rem' }}>
                  Recuperar Contraseña
                </h2>
              </div>
              <p className="text-muted text-sm" style={{ marginBottom: '1.75rem' }}>
                Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace seguro para crear una nueva contraseña.
              </p>

              {error && <div className="alert-danger" style={{ marginBottom: '1.25rem' }}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Correo electrónico</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="nombre@ejemplo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <Mail
                      size={17}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  style={{ padding: '0.75rem', fontSize: '1rem', fontWeight: 700 }}
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" inline text="Enviando..." color="white" />
                  ) : (
                    'Enviar instrucciones'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#e6f7ed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                  }}
                >
                  <CheckCircle2 size={32} color="#00a650" />
                </div>
                <h3 style={{ color: 'var(--text-title)', fontWeight: 800, margin: '0 0 6px 0' }}>
                  ¡Instrucciones enviadas!
                </h3>
                <p className="text-muted text-sm" style={{ margin: 0, lineHeight: 1.5 }}>
                  Si <strong>{email}</strong> está registrado en Turnos Ya, recibirás un correo con el enlace para restablecer tu contraseña. El enlace tiene 1 hora de validez.
                </p>
              </div>

              {/* Banner de acceso directo para QA y pruebas rápidas */}
              {qaResetToken && (
                <div
                  style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                    <Sparkles size={16} color="#0284c7" /> Acceso directo para pruebas (QA)
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#0c4a6e', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    Puedes continuar la prueba de inmediato sin esperar el envío de correo SMTP:
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/reset-password?token=${qaResetToken}`)}
                    className="btn btn-primary btn-full"
                    style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                  >
                    Restablecer contraseña ahora
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="btn btn-light btn-full"
                style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}
              >
                Probar con otro correo
              </button>
            </div>
          )}

          <div className="divider" style={{ margin: '1.5rem 0' }} />
          <div style={{ textAlign: 'center' }}>
            <Link
              to="/login"
              style={{
                color: 'var(--primary-color)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={16} /> Volver a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoverPassword;
