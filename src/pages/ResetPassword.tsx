import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Debes ingresar un token de recuperación válido.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token: token.trim(),
        newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'El enlace de recuperación es inválido o ha expirado. Por favor solicita uno nuevo.'
      );
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

          {!success ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <Lock size={22} color="var(--primary-color)" />
                <h2 style={{ color: 'var(--text-title)', fontWeight: 800, margin: 0, fontSize: '1.4rem' }}>
                  Nueva Contraseña
                </h2>
              </div>
              <p className="text-muted text-sm" style={{ marginBottom: '1.75rem' }}>
                Crea una nueva contraseña segura para tu cuenta de Turnos Ya.
              </p>

              {error && <div className="alert-danger" style={{ marginBottom: '1.25rem' }}>{error}</div>}

              <form onSubmit={handleSubmit}>
                {tokenFromUrl && (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.82rem',
                      color: '#166534',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={16} color="#16a34a" />
                    Enlace seguro verificado. Ingresa tu nueva contraseña a continuación.
                  </div>
                )}

                {!tokenFromUrl && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div
                      style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginBottom: '1rem',
                        fontSize: '0.82rem',
                        color: '#1e40af',
                        lineHeight: 1.4,
                      }}
                    >
                      💡 <strong>Tip:</strong> Al hacer clic en el botón <strong>"Restablecer mi contraseña"</strong> del correo que te enviamos, este código se completa automáticamente.
                    </div>
                    <div className="form-group">
                      <label className="form-label">Código o Token de Recuperación</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Pega aquí tu token o enlace recibido"
                        value={token}
                        onChange={e => {
                          const val = e.target.value.trim();
                          if (val.includes('token=')) {
                            try {
                              const parsed = new URL(val, window.location.origin).searchParams.get('token');
                              setToken(parsed || val);
                            } catch {
                              setToken(val);
                            }
                          } else {
                            setToken(val);
                          }
                        }}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Nueva Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      style={{ paddingRight: '2.75rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                      }}
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Confirmar Nueva Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      style={{ paddingRight: '2.75rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                      }}
                      tabIndex={-1}
                    >
                      {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  style={{ padding: '0.75rem', fontSize: '1rem', fontWeight: 700 }}
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" inline text="Actualizando..." color="white" />
                  ) : (
                    'Guardar nueva contraseña'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#e6f7ed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <CheckCircle2 size={36} color="#00a650" />
              </div>
              <h3 style={{ color: 'var(--text-title)', fontWeight: 800, margin: '0 0 8px 0', fontSize: '1.3rem' }}>
                ¡Contraseña restablecida!
              </h3>
              <p className="text-muted text-sm" style={{ margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
                Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva clave.
              </p>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn btn-primary btn-full"
                style={{ padding: '0.75rem', fontSize: '1rem', fontWeight: 700, gap: '8px' }}
              >
                Iniciar Sesión <ArrowRight size={18} />
              </button>
            </div>
          )}

          <div className="divider" style={{ margin: '1.5rem 0' }} />
          <div style={{ textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
