import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para 2FA en login
  const [requireTwoFactor, setRequireTwoFactor] = useState(false);
  const [twoFactorTempToken, setTwoFactorTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.require2FA) {
        setRequireTwoFactor(true);
        setTwoFactorTempToken(response.data.tempToken);
        setError('');
        return;
      }
      login(response.data.token, response.data.user);
      const role = response.data.user?.role;
      navigate(role === 'owner' || role === 'administrator' ? '/' : '/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Correo electrónico o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/2fa/login-verify', {
        tempToken: twoFactorTempToken,
        code: twoFactorCode,
      });
      login(response.data.token, response.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código de verificación incorrecto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div className="ml-card" style={{ padding: '2.5rem' }}>
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <img
              src="/assets/brand/logo-color.png"
              alt="Turnos Ya"
              style={{ height: '48px', objectFit: 'contain' }}
            />
          </div>
          <h2 style={{ color: 'var(--text-title)', fontWeight: 800, marginBottom: '0.25rem' }}>Iniciar sesión</h2>
          <p className="text-muted text-sm" style={{ marginBottom: '1.75rem' }}>
            Ingresa tus credenciales para administrar tus citas y negocios.
          </p>

          {error && <div className="alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

          {requireTwoFactor ? (
            <form onSubmit={handleTwoFactorSubmit}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 158, 227, 0.1)', color: '#009ee3', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={26} />
                </div>
                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                  Verificación en dos pasos
                </h3>
                <p className="text-muted text-sm" style={{ margin: 0 }}>
                  Ingresá el código de 6 dígitos generado por tu app Google Authenticator o un código de respaldo.
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  maxLength={8}
                  placeholder="123456"
                  className="form-control"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\s+/g, ''))}
                  autoFocus
                  required
                  style={{ textAlign: 'center', fontSize: '1.35rem', letterSpacing: '4px', fontWeight: 700 }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ padding: '0.75rem', fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}
                disabled={loading || twoFactorCode.length < 6}
              >
                {loading ? <LoadingSpinner size="sm" inline text="Verificando..." color="white" /> : 'Confirmar e Iniciar sesión'}
              </button>

              <button
                type="button"
                className="btn btn-light btn-full"
                onClick={() => {
                  setRequireTwoFactor(false);
                  setTwoFactorTempToken('');
                  setTwoFactorCode('');
                  setError('');
                }}
              >
                Volver
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Correo electrónico</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="nombre@ejemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-control"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      style={{ paddingRight: '3rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="rememberMe" className="text-muted text-sm" style={{ cursor: 'pointer' }}>
                    Recordarme por 30 días
                  </label>
                </div>

                <button type="submit" className="btn btn-primary btn-full" style={{ padding: '0.75rem', fontSize: '1rem', fontWeight: 700 }} disabled={loading}>
                  {loading ? (
                    <LoadingSpinner size="sm" inline text="Ingresando..." color="white" />
                  ) : (
                    <>
                      <LogIn size={18} /> Ingresar
                    </>
                  )}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', color: '#94a3b8' }}>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                <span style={{ padding: '0 10px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>O bien</span>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              </div>

              <GoogleSignInButton
                buttonText="Continuar con Google"
                onError={err => setError(err)}
              />

              <div className="divider" style={{ margin: '1.25rem 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', alignItems: 'center' }}>
                <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
                  Crear una cuenta nueva
                </Link>
                <Link to="/recover" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
