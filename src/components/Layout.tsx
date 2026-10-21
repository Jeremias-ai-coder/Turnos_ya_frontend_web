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
            <Link to="/" className="navbar-brand" title="Turnos Ya - Inicio">
              <img
                src="/assets/brand/logo-white.png"
                alt="Turnos Ya"
                className="brand-logo-nav"
              />
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
                  <Link to="/my-appointments" className="navbar-link navbar-link-desktop">Mis Turnos</Link>
                  <Link to="/dashboard" className="navbar-link navbar-link-desktop">
                    {user.role === 'client' ? 'Registrar Negocio' : 'Mi Panel'}
                  </Link>
                  {user.role === 'administrator' && (
                    <Link to="/system" className="navbar-link navbar-link-desktop" style={{ opacity: 0.8 }}>⚙ Sistema</Link>
                  )}
                  <NotificationBell />
                  <div className="navbar-separator" />
                  <Link to="/profile" className="user-avatar-nav" title={user.name}>{initials}</Link>
                  <span className="navbar-username-desktop" style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{user.name.split(' ')[0]}</span>
                  <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión" aria-label="Cerrar sesión">
                    <LogOut size={14} /><span className="logout-text-desktop"> Salir</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="navbar-link navbar-link-desktop">Iniciar Sesión</Link>
                  <Link to="/register" className="btn btn-light navbar-link-desktop" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>

            {user ? (
              <div className="navbar-mobile-links">
                <Link to="/my-appointments" className="navbar-mobile-pill">Mis Turnos</Link>
                <Link to="/dashboard" className="navbar-mobile-pill">
                  {user.role === 'client' ? 'Registrar Negocio' : 'Mi Panel'}
                </Link>
                {user.role === 'administrator' && (
                  <Link to="/system" className="navbar-mobile-pill">⚙ Sistema</Link>
                )}
              </div>
            ) : (
              <div className="navbar-mobile-links">
                <Link to="/login" className="navbar-mobile-pill">Iniciar Sesión</Link>
                <Link to="/register" className="navbar-mobile-pill" style={{ background: '#ffffff', color: 'var(--primary-color)' }}>Crear cuenta</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="container page-main">
        <Outlet />
      </main>
    </div>
  );
};
