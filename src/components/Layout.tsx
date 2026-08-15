import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, LogOut, User, Search } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

            <div className="search-group">
              <input
                type="text"
                className="search-input"
                placeholder="Buscar negocios o servicios..."
              />
              <button className="search-btn" aria-label="Buscar">
                <Search size={16} />
              </button>
            </div>

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
