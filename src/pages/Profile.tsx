import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Bell, Phone, Save, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  role: string;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
}

const Profile: React.FC = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    role: user?.role || '',
    emailNotifications: true,
    whatsappNotifications: false,
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get('/users/me');
        setForm({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          role: res.data.role || '',
          emailNotifications: res.data.emailNotifications ?? true,
          whatsappNotifications: res.data.whatsappNotifications ?? false,
        });
      } catch { /* ignore */ }
    };
    fetchMe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const res = await api.patch('/auth/profile', {
        name: form.name,
        phone: form.phone,
        emailNotifications: form.emailNotifications,
        whatsappNotifications: form.whatsappNotifications,
      });
      // Update stored user
      const stored = localStorage.getItem('token');
      if (stored) login(stored, res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const ROLE_LABELS: Record<string, string> = {
    client: 'Cliente',
    owner: 'Dueño de Negocio',
    administrator: 'Administrador del Sistema',
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--text-title)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.375rem' }}>Mi Perfil</h1>
      <p className="text-muted text-sm" style={{ marginBottom: '2rem' }}>Administra tu cuenta y preferencias de notificación.</p>

      {/* Banner de identidad */}
      <div className="ml-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #009ee3, #0081bb)', color: 'white', fontWeight: 800, fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {form.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontWeight: 800, color: 'var(--text-title)', marginBottom: '4px' }}>{form.name}</h2>
          <p className="text-muted text-sm">{form.email}</p>
          <span className={`badge ${form.role === 'administrator' ? 'badge-pending' : form.role === 'owner' ? 'badge-confirmed' : 'badge-completed'}`} style={{ marginTop: '6px' }}>
            {ROLE_LABELS[form.role] || form.role}
          </span>
        </div>
        <button className="btn btn-light" style={{ fontSize: '0.85rem', color: 'var(--status-danger-text)' }} onClick={handleLogout}>
          <LogOut size={15} /> Cerrar Sesión
        </button>
      </div>

      {/* Formulario */}
      <div className="ml-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} color="var(--primary-color)" /> Información Personal
        </h3>

        {error && <div className="alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
        {saved && <div className="alert-success" style={{ marginBottom: '1rem' }}>✓ Cambios guardados correctamente.</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre Completo</label>
              <input
                type="text"
                className="form-control"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono / WhatsApp</label>
              <input
                type="tel"
                className="form-control"
                placeholder="+54 9 11 1234-5678"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input type="email" className="form-control" value={form.email} disabled style={{ opacity: 0.7, background: '#f8fafc' }} />
            <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '4px' }}>El email no puede modificarse desde el perfil.</p>
          </div>

          <div className="divider" />

          <h3 style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} color="var(--primary-color)" /> Preferencias de Notificación
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '1rem', background: 'var(--background-app)', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
              <input
                type="checkbox"
                checked={form.emailNotifications}
                onChange={e => setForm(f => ({ ...f, emailNotifications: e.target.checked }))}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <p style={{ fontWeight: 600, marginBottom: '2px' }}>Notificaciones por Email</p>
                <p className="text-muted text-xs">Recibir recordatorios y confirmaciones de turnos por correo.</p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '1rem', background: 'var(--background-app)', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
              <input
                type="checkbox"
                checked={form.whatsappNotifications}
                onChange={e => setForm(f => ({ ...f, whatsappNotifications: e.target.checked }))}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <p style={{ fontWeight: 600, marginBottom: '2px' }}>Notificaciones por WhatsApp</p>
                <p className="text-muted text-xs">Recibir alertas directas al número de WhatsApp configurado.</p>
              </div>
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ padding: '0.75rem' }} disabled={loading}>
            <Save size={18} />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>

      {/* Accesos rápidos según rol */}
      {(form.role === 'owner' || form.role === 'administrator') && (
        <div className="ml-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '1rem' }}>Acceso Rápido</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {(form.role === 'owner' || form.role === 'administrator') && (
              <a href="/dashboard" className="btn btn-outline-primary" style={{ fontSize: '0.88rem' }}>
                🏪 Panel de mi Negocio
              </a>
            )}
            {form.role === 'administrator' && (
              <a href="/system" className="btn btn-light" style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                ⚙ Administración del Sistema
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
