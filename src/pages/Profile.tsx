import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Bell, ShieldCheck, Lock, Save, LogOut, Settings2, CheckCircle2, AlertCircle, AlertTriangle, Mail, KeyRound, Sparkles, X, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ActiveTab = 'profile' | 'security' | 'notifications' | 'privacy';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  role: string;
  emailVerified: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
}

interface SecurityForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PrivacySettings {
  sharePhone: boolean;
  systemContact: boolean;
  basicVisibility: boolean;
}

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
  const { user, login, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [profileForm, setProfileForm] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || '',
    emailVerified: user?.emailVerified ?? false,
    emailNotifications: user?.emailNotifications ?? true,
    whatsappNotifications: user?.whatsappNotifications ?? false,
  });

  const [securityForm, setSecurityForm] = useState<SecurityForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Modal y flujo de cambio de contraseña
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordModalStep, setPasswordModalStep] = useState<'verify_code' | 'set_passwords'>('verify_code');
  const [changeToken, setChangeToken] = useState<string | null>(null);
  const [changeAuthToken, setChangeAuthToken] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [qaPasswordCode, setQaPasswordCode] = useState<string | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Visibilidad de contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados para "¿Olvidaste tu contraseña?"
  const [forgotPasswordActive, setForgotPasswordActive] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState<'reset_directly' | 'email_link'>('email_link');
  const [forgotPasswordSending, setForgotPasswordSending] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  // Estados para verificación de correo progresiva
  const [emailVerificationSending, setEmailVerificationSending] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [qaEmailCode, setQaEmailCode] = useState<string | null>(null);
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);

  const [privacy, setPrivacy] = useState<PrivacySettings>(defaultPrivacy);

  const [loading, setLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshProfileFromServer = async () => {
    const res = await api.get('/users/me');
    const freshUser = res.data;

    setProfileForm({
      name: freshUser.name || '',
      email: freshUser.email || '',
      phone: freshUser.phone || '',
      role: freshUser.role || '',
      emailVerified: freshUser.emailVerified ?? false,
      emailNotifications: freshUser.emailNotifications ?? true,
      whatsappNotifications: freshUser.whatsappNotifications ?? false,
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
        // noop
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
        emailVerified: res.data.emailVerified ?? profileForm.emailVerified,
        emailNotifications: res.data.emailNotifications ?? profileForm.emailNotifications,
        whatsappNotifications: res.data.whatsappNotifications ?? profileForm.whatsappNotifications,
      });

      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        login(storedToken, res.data);
      }

      await refreshProfileFromServer();

      setProfileMessage({
        type: 'success',
        text: 'Tus datos personales se actualizaron correctamente.',
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

  const handleStartPasswordChange = async () => {
    setSecurityLoading(true);
    setSecurityMessage(null);
    setModalMessage(null);
    setVerificationCode('');
    setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setForgotPasswordActive(false);
    setForgotPasswordSent(false);
    setForgotPasswordMode('email_link');

    try {
      const res = await api.post('/auth/request-password-change-code');
      setChangeToken(res.data.confirmationToken);
      setQaPasswordCode(res.data.qaCode || null);
      setPasswordModalStep('verify_code');
      setIsPasswordModalOpen(true);
    } catch (err: any) {
      setSecurityMessage({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo enviar el código de seguridad a tu correo.',
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleVerifyPasswordCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalMessage(null);

    if (verificationCode.trim().length !== 6) {
      setModalMessage({ type: 'error', text: 'Ingresa el código de 6 dígitos recibido por correo.' });
      return;
    }

    setSecurityLoading(true);
    try {
      const res = await api.post('/auth/verify-password-change-code', {
        confirmationToken: changeToken,
        code: verificationCode.trim(),
      });

      setChangeAuthToken(res.data.changeAuthToken);
      setPasswordModalStep('set_passwords');
      setModalMessage({
        type: 'success',
        text: 'Código verificado con éxito. Ya puedes ingresar tu nueva contraseña.',
      });
    } catch (err: any) {
      setModalMessage({
        type: 'error',
        text: err.response?.data?.message || 'Código incorrecto o expirado.',
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleResendPasswordCode = async () => {
    setSecurityLoading(true);
    setModalMessage(null);
    try {
      const res = await api.post('/auth/request-password-change-code');
      setChangeToken(res.data.confirmationToken);
      setQaPasswordCode(res.data.qaCode || null);
      setModalMessage({
        type: 'success',
        text: 'Hemos reenviado un nuevo código de 6 dígitos a tu correo.',
      });
    } catch (err: any) {
      setModalMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error al reenviar el código.',
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleFinalizePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalMessage(null);

    const isDirectReset = forgotPasswordActive && forgotPasswordMode === 'reset_directly';

    if (!isDirectReset && !securityForm.currentPassword) {
      setModalMessage({ type: 'error', text: 'Debes ingresar tu contraseña actual.' });
      return;
    }

    if (!securityForm.newPassword) {
      setModalMessage({ type: 'error', text: 'Debes ingresar la nueva contraseña.' });
      return;
    }

    if (securityForm.newPassword.length < 6) {
      setModalMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setModalMessage({ type: 'error', text: 'La confirmación de la contraseña no coincide.' });
      return;
    }

    setSecurityLoading(true);
    try {
      const res = await api.post('/auth/submit-password-change', {
        changeAuthToken,
        currentPassword: isDirectReset ? undefined : securityForm.currentPassword,
        newPassword: securityForm.newPassword,
        skipCurrentPassword: isDirectReset,
      });

      setIsPasswordModalOpen(false);
      setSecurityMessage({
        type: 'success',
        text: res.data?.message || '¡La contraseña se actualizó correctamente! Te enviamos un correo informativo.',
      });

      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setVerificationCode('');
      setChangeToken(null);
      setChangeAuthToken(null);
      setQaPasswordCode(null);
      setForgotPasswordActive(false);
    } catch (err: any) {
      setModalMessage({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo actualizar la contraseña.',
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSendRecoveryEmailFromModal = async () => {
    setForgotPasswordSending(true);
    setModalMessage(null);
    try {
      await api.post('/auth/forgot-password', { email: profileForm.email });
      setForgotPasswordSent(true);
      setModalMessage({
        type: 'success',
        text: `Te enviamos un enlace de recuperación a ${profileForm.email}.`,
      });
    } catch (err: any) {
      setModalMessage({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo enviar el enlace de recuperación.',
      });
    } finally {
      setForgotPasswordSending(false);
    }
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setModalMessage(null);
    setVerificationCode('');
    setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setChangeToken(null);
    setChangeAuthToken(null);
    setQaPasswordCode(null);
    setForgotPasswordActive(false);
    setForgotPasswordSent(false);
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    try {
      const res = await api.patch('/auth/profile', {
        emailNotifications: profileForm.emailNotifications,
        whatsappNotifications: profileForm.whatsappNotifications,
      });

      setProfileForm((prev) => ({
        ...prev,
        emailNotifications: res.data.emailNotifications ?? prev.emailNotifications,
        whatsappNotifications: res.data.whatsappNotifications ?? prev.whatsappNotifications,
      }));

      setProfileMessage({
        type: 'success',
        text: 'Las preferencias de notificaciones se actualizaron correctamente.',
      });
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || 'No pudimos actualizar las notificaciones.',
      });
    }
  };

  const handleSendVerificationEmail = async () => {
    setEmailVerificationSending(true);
    setProfileMessage(null);
    try {
      const res = await api.post('/auth/send-verification-email');
      setEmailVerificationSent(true);
      setEmailVerificationToken(res.data.verificationToken || null);
      setQaEmailCode(res.data.qaCode || null);
      setProfileMessage({
        type: 'success',
        text: res.data.message || 'Código de verificación enviado a tu correo.',
      });
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error al enviar código de verificación.',
      });
    } finally {
      setEmailVerificationSending(false);
    }
  };

  const handleConfirmEmailVerification = async () => {
    if (!emailVerificationCode.trim()) return;
    setEmailVerificationLoading(true);
    setProfileMessage(null);
    try {
      const res = await api.post('/auth/verify-email', {
        code: emailVerificationCode.trim(),
        verificationToken: emailVerificationToken,
      });
      setProfileForm((prev) => ({ ...prev, emailVerified: true }));
      updateUser({ emailVerified: true });
      setEmailVerificationSent(false);
      setEmailVerificationCode('');
      setQaEmailCode(null);
      setProfileMessage({
        type: 'success',
        text: res.data.message || '¡Tu correo electrónico ha sido verificado con éxito!',
      });
      setSecurityMessage({
        type: 'success',
        text: '¡Tu usuario ha sido verificado a través de Gmail! El panel de seguridad se ha desbloqueado.',
      });
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || 'Código de verificación incorrecto o expirado.',
      });
    } finally {
      setEmailVerificationLoading(false);
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

      <div className="ml-card profile-card-responsive">
        <aside className="profile-aside-responsive">
          <div className="profile-tabs-responsive">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
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
                <span>{label}</span>
                {id === 'security' && !profileForm.emailVerified && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.68rem',
                      background: '#fffbeb',
                      color: '#d97706',
                      border: '1px solid #fde68a',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <Lock size={10} /> Bloqueado
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        <main className="profile-main-responsive">
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

              <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge badge-confirmed" style={{ fontSize: '0.78rem' }}>
                  {ROLE_LABELS[profileForm.role] || 'Cliente'}
                </span>
                {profileForm.emailVerified ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 700 }}>
                    <CheckCircle2 size={13} /> Correo verificado
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 700 }}>
                    <AlertTriangle size={13} /> Pendiente de verificación
                  </span>
                )}
              </div>

              {profileMessage && (
                <div className={profileMessage.type === 'success' ? 'alert-success' : 'alert-danger'} style={{ marginBottom: '1rem' }}>
                  {profileMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleProfileSubmit}>
                <div className="form-grid-2">
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Email</label>
                    {profileForm.emailVerified ? (
                      <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} /> Verificado
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={13} /> No verificado
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    className="form-control"
                    value={profileForm.email}
                    disabled
                    style={{ background: '#f8fafc', opacity: 0.85 }}
                  />

                  {!profileForm.emailVerified && (
                    <div style={{ marginTop: '0.85rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1.25rem' }}>
                      {!emailVerificationSent ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 240px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400e', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
                              <Mail size={16} /> ¿Tu correo aún no está verificado?
                            </div>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#b45309', lineHeight: 1.4 }}>
                              Verifícalo para asegurar la recepción de avisos de turnos y proteger tu cuenta.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ fontSize: '0.85rem', padding: '8px 16px', whiteSpace: 'nowrap' }}
                            onClick={handleSendVerificationEmail}
                            disabled={emailVerificationSending}
                          >
                            <Mail size={14} /> {emailVerificationSending ? 'Enviando...' : 'Verificar mi correo'}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                            <Mail size={17} color="#d97706" />
                            <strong style={{ fontSize: '0.92rem', color: '#92400e' }}>
                              Ingresa el código de 6 dígitos enviado a tu correo
                            </strong>
                          </div>
                          <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: '#b45309' }}>
                            Hemos enviado un código a <strong>{profileForm.email}</strong>. Revisa tu bandeja de entrada o spam.
                          </p>

                          {qaEmailCode && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
                                <Sparkles size={14} color="#16a34a" /> Modo QA / Pruebas: Código <code>{qaEmailCode}</code>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEmailVerificationCode(qaEmailCode)}
                                style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Autocompletar
                              </button>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="123456"
                              className="form-control"
                              style={{ width: '150px', textAlign: 'center', fontSize: '1.15rem', letterSpacing: '4px', fontWeight: 700 }}
                              value={emailVerificationCode}
                              onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, ''))}
                            />
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                              onClick={handleConfirmEmailVerification}
                              disabled={emailVerificationLoading || emailVerificationCode.length < 6}
                            >
                              <CheckCircle2 size={14} /> {emailVerificationLoading ? 'Verificando...' : 'Confirmar código'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-light"
                              style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                              onClick={() => setEmailVerificationSent(false)}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {profileForm.emailVerified && (
                    <small className="text-muted" style={{ display: 'block', marginTop: '0.35rem' }}>
                      Tu correo está verificado y protegido contra accesos no autorizados.
                    </small>
                  )}
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={16} /> {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-title)', fontWeight: 800 }}>Seguridad</h2>
                {profileForm.emailVerified ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 700 }}>
                    <CheckCircle2 size={13} /> Usuario verificado
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '4px 12px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 700 }}>
                    <Lock size={13} /> Panel bloqueado
                  </span>
                )}
              </div>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Cambia tu contraseña y controla el acceso a tu cuenta.</p>

              {securityMessage && (
                <div className={securityMessage.type === 'success' ? 'alert-success' : 'alert-danger'} style={{ marginBottom: '1.25rem' }}>
                  {securityMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {securityMessage.text}
                </div>
              )}

              {!profileForm.emailVerified ? (
                /* Panel Bloqueado: Requiere verificación previa por Gmail */
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '16px',
                    padding: '2.25rem 1.75rem',
                    marginBottom: '1.5rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      background: '#fef3c7',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)',
                    }}
                  >
                    <Lock size={34} />
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                    <Lock size={13} /> Panel Bloqueado por Seguridad
                  </div>

                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Verificación de usuario requerida
                  </h3>

                  <p style={{ color: '#78350f', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                    Para proteger la seguridad de tu cuenta y evitar cambios de contraseña no autorizados, este panel se encuentra bloqueado hasta que verifiques tu usuario a través de tu correo electrónico (Gmail).
                  </p>

                  <div
                    style={{
                      background: 'white',
                      border: '1px solid #fef08a',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      maxWidth: '480px',
                      margin: '0 auto 1.75rem',
                      textAlign: 'left',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Correo electrónico a verificar:</div>
                        <strong style={{ fontSize: '0.95rem', color: '#1f2937' }}>{profileForm.email}</strong>
                      </div>
                    </div>

                    {!emailVerificationSent ? (
                      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          onClick={handleSendVerificationEmail}
                          disabled={emailVerificationSending}
                        >
                          <Mail size={16} />
                          {emailVerificationSending ? 'Enviando código...' : 'Verificar mi usuario a través de Gmail'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: '0.75rem' }}>
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#4b5563' }}>
                          Ingresa el código de 6 dígitos enviado a tu correo para verificar tu cuenta y desbloquear el panel:
                        </p>

                        {qaEmailCode && (
                          <div
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              marginBottom: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
                              <Sparkles size={14} color="#16a34a" /> Modo pruebas (QA): <code>{qaEmailCode}</code>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEmailVerificationCode(qaEmailCode)}
                              className="btn btn-primary"
                              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                            >
                              Autocompletar
                            </button>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            className="form-control"
                            style={{
                              width: '140px',
                              textAlign: 'center',
                              fontSize: '1.2rem',
                              letterSpacing: '4px',
                              fontWeight: 700,
                            }}
                            value={emailVerificationCode}
                            onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, ''))}
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                            onClick={handleConfirmEmailVerification}
                            disabled={emailVerificationLoading || emailVerificationCode.length < 6}
                          >
                            <CheckCircle2 size={15} /> {emailVerificationLoading ? 'Verificando...' : 'Desbloquear panel'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-light"
                            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                            onClick={() => setEmailVerificationSent(false)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-light" onClick={handleLogout}>
                      <LogOut size={15} /> Cerrar sesión
                    </button>
                    <button type="button" className="btn btn-outline-primary" onClick={handleLogoutAll}>
                      Cerrar todas las sesiones
                    </button>
                  </div>
                </div>
              ) : (
                /* Contenedor cuando el usuario está verificado */
                <div>
                  <div
                    style={{
                      background: 'white',
                      border: '1px solid var(--border-default)',
                      borderRadius: '16px',
                      padding: '1.75rem',
                      marginBottom: '1.25rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            background: 'rgba(0, 158, 227, 0.08)',
                            color: 'var(--primary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(0, 158, 227, 0.18)',
                          }}
                        >
                          <KeyRound size={22} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-title)' }}>
                            Contraseña de acceso
                          </h3>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.86rem', color: '#64748b' }}>
                            Para mayor protección de tu cuenta, te enviaremos un código de seguridad de 6 dígitos a tu correo ({profileForm.email}).
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleStartPasswordChange}
                        disabled={securityLoading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '0.75rem 1.4rem',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          borderRadius: '10px',
                        }}
                      >
                        <KeyRound size={16} />
                        {securityLoading ? 'Iniciando verificación...' : 'Cambiar contraseña'}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '1.5rem 1.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)' }}>
                        Sesiones activas
                      </h4>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                        Controla el acceso a tu cuenta en todos tus dispositivos.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-light" onClick={handleLogout}>
                        <LogOut size={15} /> Cerrar sesión
                      </button>
                      <button type="button" className="btn btn-outline-primary" onClick={handleLogoutAll}>
                        Cerrar todas las sesiones
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal / Ventana de Cambio de Contraseña */}
              {isPasswordModalOpen && (
                <div className="modal-overlay" onClick={handleClosePasswordModal}>
                  <div
                    className="modal-box"
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}
                  >
                    {/* Header del modal */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0, 158, 227, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <KeyRound size={20} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                            Cambiar contraseña
                          </h3>
                          <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700 }}>
                            {passwordModalStep === 'verify_code' ? 'Paso 1 de 2: Verificación de código por mail' : 'Paso 2 de 2: Establecer nueva contraseña'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClosePasswordModal}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', borderRadius: '6px' }}
                        title="Cerrar ventana"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Mensajes del modal */}
                    {modalMessage && (
                      <div
                        className={modalMessage.type === 'success' ? 'alert-success' : 'alert-danger'}
                        style={{ marginBottom: '1.25rem', fontSize: '0.88rem' }}
                      >
                        {modalMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {modalMessage.text}
                      </div>
                    )}

                    {passwordModalStep === 'verify_code' ? (
                      /* PASO 1: Ventana que pide el código de 6 dígitos enviado al mail */
                      <form onSubmit={handleVerifyPasswordCode}>
                        <div
                          style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '12px',
                            padding: '1rem',
                            marginBottom: '1.25rem',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Mail size={18} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <p style={{ margin: 0, fontSize: '0.84rem', color: '#166534', lineHeight: 1.45 }}>
                            Te enviamos un código de seguridad de 6 dígitos a <strong>{profileForm.email}</strong>. Ingrésalo para verificar tu cuenta y continuar.
                          </p>
                        </div>

                        {qaPasswordCode && (
                          <div
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              marginBottom: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                              <Sparkles size={14} color="#009ee3" /> Modo pruebas (QA): <code>{qaPasswordCode}</code>
                            </div>
                            <button
                              type="button"
                              onClick={() => setVerificationCode(qaPasswordCode)}
                              className="btn btn-primary"
                              style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                            >
                              Autocompletar
                            </button>
                          </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                          <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                            Código de verificación (6 dígitos)
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            className="form-control"
                            placeholder="123456"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            style={{
                              fontSize: '1.4rem',
                              letterSpacing: '6px',
                              textAlign: 'center',
                              fontWeight: 700,
                              maxWidth: '220px',
                              margin: '0 auto',
                            }}
                            autoFocus
                            required
                          />
                          <small className="text-muted" style={{ display: 'block', marginTop: '6px' }}>
                            El código expira en 15 minutos. Revisa tu bandeja de entrada o spam.
                          </small>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                          <button type="button" className="btn btn-light" onClick={handleClosePasswordModal}>
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={handleResendPasswordCode}
                            disabled={securityLoading}
                          >
                            <Mail size={14} /> Reenviar código
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={securityLoading || verificationCode.length !== 6}
                          >
                            <CheckCircle2 size={16} /> {securityLoading ? 'Verificando...' : 'Verificar código'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* PASO 2: Una vez comprobado el mail, aparecen los cuadros de texto para contraseñas */
                      <form onSubmit={handleFinalizePasswordChange}>
                        <div
                          style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            borderRadius: '10px',
                            padding: '8px 12px',
                            marginBottom: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.82rem',
                            color: '#065f46',
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={16} color="#059669" /> Correo verificado con éxito. Ya puedes ingresar tu nueva contraseña.
                        </div>

                        {(!forgotPasswordActive || forgotPasswordMode !== 'reset_directly') && (
                          <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ fontWeight: 600 }}>Contraseña actual</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                className="form-control"
                                placeholder="Ingresa tu contraseña actual"
                                value={securityForm.currentPassword}
                                onChange={(e) => setSecurityForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                required={!forgotPasswordActive || forgotPasswordMode !== 'reset_directly'}
                                style={{ paddingRight: '2.5rem' }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                style={{
                                  position: 'absolute',
                                  right: '10px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#94a3b8',
                                  padding: 0,
                                  display: 'flex',
                                }}
                              >
                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label className="form-label" style={{ fontWeight: 600 }}>Nueva contraseña</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              className="form-control"
                              placeholder="Mínimo 6 caracteres"
                              value={securityForm.newPassword}
                              onChange={(e) => setSecurityForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                              required
                              style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                padding: 0,
                                display: 'flex',
                              }}
                            >
                              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label className="form-label" style={{ fontWeight: 600 }}>Confirmar nueva contraseña</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              className="form-control"
                              placeholder="Repite tu nueva contraseña"
                              value={securityForm.confirmPassword}
                              onChange={(e) => setSecurityForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                              required
                              style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                padding: 0,
                                display: 'flex',
                              }}
                            >
                              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Botón "¿Olvidaste tu contraseña?" */}
                        <div style={{ marginTop: '0.6rem', marginBottom: '1.25rem' }}>
                          <button
                            type="button"
                            onClick={() => setForgotPasswordActive(!forgotPasswordActive)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--primary-color)',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: 0,
                              textDecoration: 'underline',
                            }}
                          >
                            ¿Olvidaste tu contraseña?
                          </button>

                          {forgotPasswordActive && (
                            <div
                              style={{
                                marginTop: '0.75rem',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '12px 14px',
                              }}
                            >
                              <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                                ¿No recuerdas tu contraseña actual? Como ya verificaste tu identidad con el código de 6 dígitos enviado a tu correo, puedes crear tu nueva clave directamente o recibir un enlace por email.
                              </p>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className={forgotPasswordMode === 'reset_directly' ? 'btn btn-primary' : 'btn btn-outline-primary'}
                                  style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                  onClick={() => setForgotPasswordMode(forgotPasswordMode === 'reset_directly' ? 'email_link' : 'reset_directly')}
                                >
                                  {forgotPasswordMode === 'reset_directly' ? '✓ Estableciendo sin contraseña actual' : 'Restablecer sin contraseña actual'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-light"
                                  style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                  onClick={handleSendRecoveryEmailFromModal}
                                  disabled={forgotPasswordSending}
                                >
                                  <Mail size={12} /> {forgotPasswordSending ? 'Enviando...' : 'Enviar enlace a mi correo'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                          <button type="button" className="btn btn-light" onClick={handleClosePasswordModal}>
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={securityLoading}
                          >
                            <Save size={16} /> {securityLoading ? 'Actualizando...' : 'Guardar nueva contraseña'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--text-title)', fontWeight: 800 }}>Notificaciones</h2>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Controla cómo querés recibir los avisos del sistema y los recordatorios de turnos.</p>

              {profileMessage && (
                <div className={profileMessage.type === 'success' ? 'alert-success' : 'alert-danger'} style={{ marginBottom: '1rem' }}>
                  {profileMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleNotificationSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.9rem 1rem', border: '1px solid var(--border-default)', borderRadius: '12px', background: 'var(--background-app)' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-title)' }}>Notificaciones por email</div>
                      <small className="text-muted">Recibir avisos y recordatorios por correo.</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileForm.emailNotifications}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, emailNotifications: e.target.checked }))}
                      style={{ width: '18px', height: '18px' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.9rem 1rem', border: '1px solid var(--border-default)', borderRadius: '12px', background: 'var(--background-app)' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-title)' }}>Notificaciones por WhatsApp</div>
                      <small className="text-muted">Recibir avisos y recordatorios por WhatsApp.</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileForm.whatsappNotifications}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, whatsappNotifications: e.target.checked }))}
                      style={{ width: '18px', height: '18px' }}
                    />
                  </label>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary">
                    <Bell size={16} /> Guardar preferencias
                  </button>
                </div>
              </form>
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
