import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Search, X } from 'lucide-react';
import { NotificationBell } from './NotificationBell';


export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  // Keep input in sync if URL query parameter changes
  useEffect(() => {
    setSearchInput(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (location.pathname !== '/') {
      navigate(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/');
    } else {
      const newParams = new URLSearchParams(searchParams);
      if (trimmed) {
        newParams.set('q', trimmed);
      } else {
        newParams.delete('q');
      }
      setSearchParams(newParams);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    // Real-time filtering if already on the Home page
    if (location.pathname === '/') {
      const newParams = new URLSearchParams(searchParams);
      if (val.trim()) {
        newParams.set('q', val.trim());
      } else {
        newParams.delete('q');
      }
      setSearchParams(newParams, { replace: true });
    }
  };

  const handleClear = () => {
    setSearchInput('');
    if (location.pathname === '/') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('q');
      setSearchParams(newParams, { replace: true });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div>
      <nav className="navbar-custom">
        <div className="container">
          <div className="navbar-inner">
            <Link to="/" className="navbar-brand">
              <div className="logo-nav">TY</div>
              Turnos Ya
            </Link>

            <form className="search-group" onSubmit={handleSearchSubmit} role="search">
              <input
                type="text"
                className="search-input"
                placeholder="Buscar negocios o servicios..."
                value={searchInput}
                onChange={handleInputChange}
                aria-label="Buscar negocios o servicios"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Borrar búsqueda"
                  aria-label="Borrar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="search-btn" aria-label="Buscar">
                <Search size={16} />
              </button>
            </form>

            <div className="navbar-actions">
              {user ? (
                <>
                  <Link to="/my-appointments" className="navbar-link">Mis Turnos</Link>
                  <Link to="/dashboard" className="navbar-link">
                    {user.role === 'client' ? 'Registrar Negocio' : 'Mi Panel'}
                  </Link>
                  {user.role === 'administrator' && (
                    <Link to="/system" className="navbar-link" style={{ opacity: 0.8 }}>⚙ Sistema</Link>
                  )}
                  <NotificationBell />
                  <div className="navbar-separator" />
                  <Link to="/profile" className="user-avatar-nav" title={user.name}>{initials}</Link>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{user.name.split(' ')[0]}</span>
                  <button className="btn-logout" onClick={handleLogout}>
                    <LogOut size={14} /> Salir
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="navbar-link">Iniciar Sesión</Link>
                  <Link to="/register" className="btn btn-light" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container page-main">
        <Outlet />
      </main>
    </div>
  );
};
