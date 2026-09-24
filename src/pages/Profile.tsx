import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Bell, ShieldCheck, Lock, Save, LogOut, Settings2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ActiveTab = 'profile' | 'security' | 'notifications' | 'privacy';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface SecurityForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  remindersEmail: boolean;
  remindersSms: boolean;
  reservationConfirmation: boolean;
  scheduleChanges: boolean;
}

interface PrivacySettings {
  sharePhone: boolean;
  systemContact: boolean;
  basicVisibility: boolean;
}

const defaultNotifications: NotificationSettings = {
  remindersEmail: true,
  remindersSms: false,
  reservationConfirmation: true,
  scheduleChanges: true,
};

const defaultPrivacy: PrivacySettings = {
  sharePhone: false,
  systemContact: true,
  basicVisibility: true,
};

const tabs: { id: ActiveTab; label: string; icon: any }[] = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'security', label: 'Seguridad', icon: ShieldCheck },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'privacy', label: 'Privacidad', icon: Settings2 },
];

const Profile: React.FC = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [profileForm, setProfileForm] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || '',
  });

  const [securityForm, setSecurityForm] = useState<SecurityForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);
  const [privacy, setPrivacy] = useState<PrivacySettings>(defaultPrivacy);

  const [loading, setLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshProfileFromServer = async () => {
    const res = await api.get('/auth/me');
    const freshUser = res.data;

    setProfileForm({
      name: freshUser.name || '',
      email: freshUser.email || '',
      phone: freshUser.phone || '',
      role: freshUser.role || '',
    });

    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      login(storedToken, freshUser);
    }

    return freshUser;
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
        await refreshProfileFromServer();
      } catch {
        // Silenciar por ahora.
      }
    };

    fetchMe();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProfileMessage(null);

    try {
      const res = await api.patch('/auth/profile', {
        name: profileForm.name,
        phone: profileForm.phone,
      });

      setProfileForm({
        name: res.data.name || profileForm.name,
        email: res.data.email || profileForm.email,
        phone: res.data.phone || '',
        role: res.data.role || profileForm.role,
      });

      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        login(storedToken, res.data);
      }

      const freshUser = await refreshProfileFromServer();

      setProfileMessage({
        type: 'success',
        text: `Tus datos se guardaron correctamente. Teléfono actual: ${freshUser.phone || 'sin teléfono'}`,
      });
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || 'No pudimos guardar los cambios.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Completá los tres campos para cambiar la contraseña.' });
      return;
    }

    if (securityForm.newPassword.length < 8) {
      setSecurityMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'La confirmación de la contraseña no coincide.' });
      return;
    }

    try {
      await api.patch('/auth/change-password', {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
        confirmPassword: securityForm.confirmPassword,
      });

      setSecurityMessage({
        type: 'success',
        text: 'La contraseña se actualizó correctamente.',
      });

      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setSecurityMessage({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo actualizar la contraseña.',
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogoutAll = () => {
    setSecurityMessage({
      type: 'success',
      text: 'La opción de cerrar todas las sesiones estará disponible cuando se conecte el backend.',
    });
  };

  const ROLE_LABELS: Record<string, string> = {
    client: 'Cliente',
    owner: 'Dueño de negocio',
    administrator: 'Administrador del sistema',
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-title)', fontSize: '1.9rem', fontWeight: 800 }}>Configuración</h1>
          <p className="text-muted" style={{ marginTop: '0.35rem', marginBottom: 0 }}>Administra tu cuenta, seguridad y preferencias.</p>
        </div>

        <button className="btn btn-light" style={{ fontSize: '0.85rem', color: 'var(--status-danger-text)' }} onClick={handleLogout}>
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>

      <div className="ml-card" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '620px', overflow: 'hidden' }}>
        <aside style={{ background: 'var(--background-app)', borderRight: '1px solid var(--border-default)', padding: '1.2rem 0.8rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  width: '100%',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: '12px',
                  padding: '0.85rem 0.9rem',
                  fontWeight: activeTab === id ? 700 : 600,
                  color: activeTab === id ? 'var(--primary-color)' : 'var(--text-title)',
                  background: activeTab === id ? 'rgba(0, 158, 227, 0.08)' : 'transparent',
                }}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
        </aside>

        <main style={{ padding: '1.8rem' }}>
          {activeTab === 'profile' && (
            <div>
              <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #009ee3, #0081bb)', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem' }}>
                  {profileForm.name ? profileForm.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() : 'U'}
                </div>
                <div>
                  <h2 style={{ margin: 0, color: 'var(--text-title)', fontWeight: 800 }}>{profileForm.name || 'Usuario'}</h2>
                  <p className="text-muted" style={{ margin: '0.25rem 0 0' }}>{profileForm.email || 'Sin email'}</p>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <span className="badge badge-confirmed" style={{ fontSize: '0.78rem' }}>
                  {ROLE_LABELS[profileForm.role] || 'Cliente'}
                </span>
              </div>

              {profileMessage && (
                <div className={profileMessage.type === 'success' ? 'alert-success' : 'alert-danger'} style={{ marginBottom: '1rem' }}>
                  {profileMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleProfileSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={profileForm.phone}
                      placeholder="Ej: +54 9 11 1234-5678"
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={profileForm.email}
                    disabled
                    style={{ background: '#f8fafc', opacity: 0.75 }}
                  />
                  <small className="text-muted">El email se actualiza desde la validación de cuenta o un flujo separado.</small>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={16} /> {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--text-title)', fontWeight: 800 }}>Seguridad</h2>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Cambia tu contraseña y controla el acceso a tu cuenta.</p>

              {securityMessage && (
                <div className={securityMessage.type === 'success' ? 'alert-success' : 'alert-danger'} style={{ marginBottom: '1rem' }}>
                  {securityMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {securityMessage.text}
                </div>
              )}

              <form onSubmit={handleSecuritySubmit}>
                <div className="form-group">
                  <label className="form-label">Contraseña actual</label>
                  <input
                    type="password"
                    className="form-control"
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nueva contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary">
                    <Lock size={16} /> Cambiar contraseña
                  </button>

                  <button type="button" className="btn btn-light" onClick={handleLogout}>
                    <LogOut size={16} /> Cerrar sesión
                  </button>

                  <button type="button" className="btn btn-outline-primary" onClick={handleLogoutAll}>
                    Cerrar todas las sesiones
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--text-title)', fontWeight: 800 }}>Notificaciones</h2>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Esqueleto de configuración para futuras opciones activas.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {[
                  ['Recordatorios por email', notifications.remindersEmail, () => setNotifications((prev) => ({ ...prev, remindersEmail: !prev.remindersEmail }))],
                  ['Recordatorios por SMS', notifications.remindersSms, () => setNotifications((prev) => ({ ...prev, remindersSms: !prev.remindersSms }))],
                  ['Confirmación de reserva', notifications.reservationConfirmation, () => setNotifications((prev) => ({ ...prev, reservationConfirmation: !prev.reservationConfirmation }))],
                  ['Avisos de cambios de horario', notifications.scheduleChanges, () => setNotifications((prev) => ({ ...prev, scheduleChanges: !prev.scheduleChanges }))],
                ].map(([label, checked, onToggle]) => (
                  <label key={String(label)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.9rem 1rem', border: '1px solid var(--border-default)', borderRadius: '12px', background: 'var(--background-app)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-title)' }}>{String(label)}</span>
                    <input type="checkbox" checked={Boolean(checked)} onChange={onToggle as any} style={{ width: '18px', height: '18px' }} />
                  </label>
                ))}
              </div>

              <div className="alert-warning" style={{ marginTop: '1.5rem' }}>
                Esta sección está preparada para cuando se conecte la lógica real de notificaciones.
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--text-title)', fontWeight: 800 }}>Privacidad</h2>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Esqueleto para futuras configuraciones de datos y contacto.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {[
                  ['Permitir que el negocio vea mi teléfono', privacy.sharePhone, () => setPrivacy((prev) => ({ ...prev, sharePhone: !prev.sharePhone }))],
                  ['Permitir contacto del sistema', privacy.systemContact, () => setPrivacy((prev) => ({ ...prev, systemContact: !prev.systemContact }))],
                  ['Mostrar datos básicos para atención', privacy.basicVisibility, () => setPrivacy((prev) => ({ ...prev, basicVisibility: !prev.basicVisibility }))],
                ].map(([label, checked, onToggle]) => (
                  <label key={String(label)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.9rem 1rem', border: '1px solid var(--border-default)', borderRadius: '12px', background: 'var(--background-app)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-title)' }}>{String(label)}</span>
                    <input type="checkbox" checked={Boolean(checked)} onChange={onToggle as any} style={{ width: '18px', height: '18px' }} />
                  </label>
                ))}
              </div>

              <div className="alert-warning" style={{ marginTop: '1.5rem' }}>
                Esta sección queda preparada para el backend y la política de privacidad cuando se decida su alcance real.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;
