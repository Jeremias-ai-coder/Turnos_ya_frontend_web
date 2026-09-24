import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.token, response.data.user);
      const role = response.data.user?.role;
      navigate(role === 'owner' || role === 'administrator' ? '/' : '/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Correo electrónico o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div className="ml-card" style={{ padding: '2.5rem' }}>
          <div className="login-logo">TY</div>
          <h2 style={{ color: 'var(--text-title)', fontWeight: 800, marginBottom: '0.25rem' }}>Iniciar sesión</h2>
          <p className="text-muted text-sm" style={{ marginBottom: '1.75rem' }}>
            Ingresa tus credenciales para administrar tus citas y negocios.
          </p>

          {error && <div className="alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

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

            <button type="submit" className="btn btn-primary btn-full" style={{ padding: '0.75rem', fontSize: '1rem' }} disabled={loading}>
              <LogIn size={18} />
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', alignItems: 'center' }}>
            <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
              Crear una cuenta nueva
            </Link>
            <Link to="/recover" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
