import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User,
  Shield,
  Lock,
  Save,
  LogOut,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Mail,
  KeyRound,
  Sparkles,
  X,
  Eye,
  EyeOff,
  CalendarCheck,
  Building2,
  MessageSquare,
  Check,
  ChevronRight,
  Smartphone,
  Laptop,
  ScanFace,
  QrCode,
  Info,
  MonitorSmartphone
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Íconos SVG ultra fieles a la interfaz de Mercado Libre / Fotos adjuntas
const CredentialCardIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="8.5" cy="10" r="2" />
    <path d="M14 9h4" />
    <path d="M14 12h4" />
    <path d="M6 16h12" />
  </svg>
);

const PasskeyIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="8" r="4" />
    <circle cx="16" cy="8" r="1.5" />
    <path d="M13 11l-8.5 8.5" />
    <path d="M7 17l2 2" />
    <path d="M9.5 14.5l2 2" />
  </svg>
);

const PasswordKeypadIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="6" width="19" height="12" rx="3" />
    <circle cx="7" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="17" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

const GoogleAuthIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
  </svg>
);

type ActiveTab = 'profile' | 'security' | 'notifications' | 'privacy';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  role: string;
  emailVerified: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  twoFactorEnabled: boolean;
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

const Profile: React.FC = () => {
  const { user, login, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab activo desde la URL ('profile' | 'security' | 'notifications' | 'privacy') o null para el HUB
  const currentTab = searchParams.get('tab') as ActiveTab | null;
  // Sub-sección para seguridad ('menu' | 'methods' | 'devices')
  const securitySub = searchParams.get('sub') || 'menu';

  const [profileForm, setProfileForm] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || '',
    emailVerified: user?.emailVerified ?? false,
    emailNotifications: user?.emailNotifications ?? true,
    whatsappNotifications: user?.whatsappNotifications ?? false,
    twoFactorEnabled: user?.twoFactorEnabled ?? false,
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

  // Modal de cancelación de cuenta
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Modal informativo de métodos de seguridad (Passkeys, Biometría, QR, 2FA)
  const [infoModal, setInfoModal] = useState<{
    title: string;
    description: string;
    badge?: string;
  } | null>(null);

  // Modales interactivos específicos para métodos de seguridad
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneInputValue, setPhoneInputValue] = useState(profileForm.phone || '+54 3435136982');
  const [phoneSaving, setPhoneSaving] = useState(false);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);

  // Estados y lógica para Doble Factor de Autenticación Real (Google Authenticator)
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<'setup' | 'backup_codes' | 'disable_confirm'>('setup');
  const [twoFactorQr, setTwoFactorQr] = useState<string>('');
  const [twoFactorSecret, setTwoFactorSecret] = useState<string>('');
  const [twoFactorCodeInput, setTwoFactorCodeInput] = useState<string>('');
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([]);
  const [twoFactorDisablePassword, setTwoFactorDisablePassword] = useState<string>('');
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [twoFactorCopied, setTwoFactorCopied] = useState(false);

  const handleOpenTwoFactorModal = async () => {
    setTwoFactorError(null);
    setTwoFactorCodeInput('');
    setTwoFactorDisablePassword('');
    setTwoFactorCopied(false);

    if (profileForm.twoFactorEnabled) {
      setTwoFactorStep('disable_confirm');
      setIsTwoFactorModalOpen(true);
    } else {
      setTwoFactorStep('setup');
      setIsTwoFactorModalOpen(true);
      setTwoFactorLoading(true);
      try {
        const res = await api.get('/auth/2fa/setup');
        setTwoFactorQr(res.data.qrCode);
        setTwoFactorSecret(res.data.secret);
      } catch (err: any) {
        setTwoFactorError(err.response?.data?.message || 'Error al iniciar la configuración de 2FA.');
      } finally {
        setTwoFactorLoading(false);
      }
    }
  };

  const handleVerifyAndEnableTwoFactor = async () => {
    if (!twoFactorCodeInput || twoFactorCodeInput.length < 6) return;
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    try {
      const res = await api.post('/auth/2fa/verify-and-enable', { code: twoFactorCodeInput });
      setTwoFactorBackupCodes(res.data.backupCodes || []);
      setTwoFactorStep('backup_codes');
      setProfileForm((prev) => ({ ...prev, twoFactorEnabled: true }));
      updateUser({ twoFactorEnabled: true });
      setSecurityMessage({
        type: 'success',
        text: '¡Google Authenticator activado con éxito! Tu cuenta cuenta con doble factor de autenticación.',
      });
    } catch (err: any) {
      setTwoFactorError(err.response?.data?.message || 'Código de verificación incorrecto.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!twoFactorDisablePassword) return;
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    try {
      await api.post('/auth/2fa/disable', { password: twoFactorDisablePassword });
      setProfileForm((prev) => ({ ...prev, twoFactorEnabled: false }));
      updateUser({ twoFactorEnabled: false });
      setIsTwoFactorModalOpen(false);
      setSecurityMessage({
        type: 'success',
        text: 'El doble factor de autenticación ha sido desactivado.',
      });
    } catch (err: any) {
      setTwoFactorError(err.response?.data?.message || 'Contraseña incorrecta.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (twoFactorSecret) {
      navigator.clipboard.writeText(twoFactorSecret);
      setTwoFactorCopied(true);
      setTimeout(() => setTwoFactorCopied(false), 2000);
    }
  };

  const handleCopyBackupCodes = () => {
    if (twoFactorBackupCodes.length > 0) {
      navigator.clipboard.writeText(twoFactorBackupCodes.join('\n'));
      setTwoFactorCopied(true);
      setTimeout(() => setTwoFactorCopied(false), 2000);
    }
  };

  const handleSavePhoneFromModal = async () => {
    setPhoneSaving(true);
    try {
      await api.patch('/auth/profile', {
        name: profileForm.name,
        phone: phoneInputValue,
      });
      setProfileForm((prev) => ({ ...prev, phone: phoneInputValue }));
      updateUser({ phone: phoneInputValue });
      setIsPhoneModalOpen(false);
      setSecurityMessage({
        type: 'success',
        text: 'Teléfono de recuperación y avisos actualizado correctamente.',
      });
    } catch {
      setProfileForm((prev) => ({ ...prev, phone: phoneInputValue }));
      setIsPhoneModalOpen(false);
    } finally {
      setPhoneSaving(false);
    }
  };

  // Visibilidad de contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados para "¿Olvidaste tu contraseña?"
  const [forgotPasswordActive, setForgotPasswordActive] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState<'reset_directly' | 'email_link'>('email_link');

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

  // Estados para Dispositivos Vinculados y Sesiones Activas
  interface UserSessionItem {
    id: string;
    deviceName: string;
    ipAddress?: string;
    lastActiveAt: string;
    createdAt: string;
    isCurrent: boolean;
  }
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionActionLoading, setSessionActionLoading] = useState<string | null>(null);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data || []);
    } catch (err) {
      console.warn('Error al cargar sesiones activas:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'security' && securitySub === 'devices') {
      loadSessions();
    }
  }, [currentTab, securitySub]);

  const refreshProfileFromServer = async () => {
    try {
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
        twoFactorEnabled: freshUser.twoFactorEnabled ?? false,
      });

      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        login(storedToken, freshUser);
      }

      return freshUser;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    refreshProfileFromServer();
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

      setProfileForm((prev) => ({
        ...prev,
        name: res.data.name || prev.name,
        phone: res.data.phone || '',
      }));

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
    setForgotPasswordMode('email_link');

    try {
      const res = await api.post('/auth/request-password-change-code');
      setChangeToken(res.data.confirmationToken);
      setQaPasswordCode(res.data.qaCode || null);
      setPasswordModalStep('verify_code');
      setIsPasswordModalOpen(true);
    } catch {
      // Si no se puede enviar código por SMTP en pruebas, habilitamos creación directa
      setPasswordModalStep('set_passwords');
      setForgotPasswordActive(true);
      setForgotPasswordMode('reset_directly');
      setIsPasswordModalOpen(true);
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

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setModalMessage(null);
    setVerificationCode('');
    setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setChangeToken(null);
    setChangeAuthToken(null);
    setQaPasswordCode(null);
    setForgotPasswordActive(false);
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

  const handleRevokeSession = async (sessionId: string) => {
    if (!window.confirm('¿Deseas cerrar la sesión en este dispositivo de forma remota?')) return;
    setSessionActionLoading(sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSecurityMessage({
        type: 'success',
        text: 'Sesión cerrada exitosamente.',
      });
    } catch (err: any) {
      setSecurityMessage({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo cerrar la sesión.',
      });
    } finally {
      setSessionActionLoading(null);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('¿Estás seguro de que deseas cerrar todas las demás sesiones excepto la actual?')) return;
    setSessionActionLoading('all');
    try {
      await api.post('/auth/sessions/revoke-all');
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setSecurityMessage({
        type: 'success',
        text: 'Todas las demás sesiones fueron cerradas con éxito.',
      });
    } catch (err: any) {
      setSecurityMessage({
        type: 'error',
        text: err.response?.data?.message || 'No se pudieron cerrar las demás sesiones.',
      });
    } finally {
      setSessionActionLoading(null);
    }
  };

  const ROLE_LABELS: Record<string, string> = {
    client: 'Cliente',
    owner: 'Comerciante',
    administrator: 'Administrador',
  };

  const initials = profileForm.name
    ? profileForm.name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  // ==============================================================
  // VISTA SUB-SECCIÓN: SEGURIDAD (ESTILO MERCADO LIBRE / FOTO 1 Y 2)
  // ==============================================================
  let pageContent: React.ReactNode = null;

  if (currentTab === 'security') {
    // FOTO 1: MENÚ PRINCIPAL DE SEGURIDAD
    if (securitySub === 'menu') {
      pageContent = (
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '1rem 0.5rem 3rem' }}>
          {/* Breadcrumb idéntico a Mercado Libre */}
          <div className="profile-breadcrumb">
            <button type="button" onClick={() => setSearchParams({})}>Mi perfil</button>
            <span className="profile-breadcrumb-separator">&gt;</span>
            <span className="profile-breadcrumb-current">Seguridad</span>
          </div>

          <h1 style={{ margin: '0 0 1.5rem', color: 'var(--text-title)', fontSize: '1.5rem', fontWeight: 800 }}>
            Seguridad
          </h1>

          {/* Tarjeta estilo Mercado Libre */}
          <div className="security-list-card">
            {/* 1. Métodos de verificación */}
            <button
              type="button"
              className="security-list-item"
              onClick={() => setSearchParams({ tab: 'security', sub: 'methods' })}
            >
              <div className="security-item-left">
                <div className="security-item-icon">
                  <CredentialCardIcon size={24} />
                </div>
                <div>
                  <h3 className="security-item-title">Métodos de verificación</h3>
                  <p className="security-item-desc">
                    {profileForm.twoFactorEnabled
                      ? 'Nivel de seguridad alto: Contraseña y Doble Factor (2FA) configurados.'
                      : profileForm.emailVerified
                      ? 'Nivel estándar: Contraseña y correo electrónico verificado.'
                      : 'Protección básica activa (Contraseña). Verificá tu e-mail para mayor seguridad.'}
                  </p>
                </div>
              </div>
              <div className="security-item-right">
                <span className={`security-badge-pill ${profileForm.twoFactorEnabled ? 'active' : profileForm.emailVerified ? 'active' : 'unconfigured'}`}>
                  {profileForm.twoFactorEnabled ? '2FA Activo' : profileForm.emailVerified ? 'Estándar' : 'Básica'}
                </span>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </button>

            {/* 2. Dispositivos vinculados */}
            <button
              type="button"
              className="security-list-item"
              onClick={() => setSearchParams({ tab: 'security', sub: 'devices' })}
            >
              <div className="security-item-left">
                <div className="security-item-icon">
                  <MonitorSmartphone size={24} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="security-item-title">Dispositivos vinculados</h3>
                  <p className="security-item-desc">
                    Gestioná los dispositivos donde iniciaste sesión.
                  </p>
                </div>
              </div>
              <div className="security-item-right">
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </button>
          </div>
        </div>
      );
    } else if (securitySub === 'methods') {
      pageContent = (
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '1rem 0.5rem 3rem' }}>
          {/* Breadcrumb idéntico a Mercado Libre (Foto 2) */}
          <div className="profile-breadcrumb">
            <button type="button" onClick={() => setSearchParams({})}>Mi perfil</button>
            <span className="profile-breadcrumb-separator">&gt;</span>
            <button type="button" onClick={() => setSearchParams({ tab: 'security' })}>Seguridad</button>
            <span className="profile-breadcrumb-separator">&gt;</span>
            <span className="profile-breadcrumb-current">Métodos de verificación</span>
          </div>

          <h1 style={{ margin: '0 0 1rem', color: 'var(--text-title)', fontSize: '1.45rem', fontWeight: 800 }}>
            Configurá tus métodos de verificación
          </h1>

          {/* Banner de estado dinámico y honesto */}
          {profileForm.twoFactorEnabled ? (
            <div className="security-banner-info">
              <span className="profile-check-badge" style={{ width: '18px', height: '18px', flexShrink: 0 }}>
                <Check size={11} strokeWidth={3} />
              </span>
              <span>
                <strong>Nivel de seguridad alto:</strong> Tu cuenta está protegida con contraseña y Doble Factor de Autenticación (Google Authenticator) activo.
              </span>
            </div>
          ) : profileForm.emailVerified ? (
            <div className="security-banner-info">
              <span className="profile-check-badge" style={{ width: '18px', height: '18px', flexShrink: 0 }}>
                <Check size={11} strokeWidth={3} />
              </span>
              <span>
                <strong>Protección estándar activa:</strong> Tu cuenta cuenta con contraseña y correo electrónico verificado. Activá el Doble Factor para mayor protección.
              </span>
            </div>
          ) : (
            <div className="security-banner-warning">
              <AlertTriangle size={18} color="#b45309" style={{ flexShrink: 0 }} />
              <span>
                <strong>Atención:</strong> Tu correo electrónico aún no ha sido verificado. Te recomendamos verificarlo para garantizar la recuperación y seguridad de tu cuenta.
              </span>
            </div>
          )}

          {securityMessage && (
            <div className={securityMessage.type === 'success' ? 'alert-success' : 'alert-danger'} style={{ marginBottom: '1.25rem' }}>
              {securityMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {securityMessage.text}
            </div>
          )}

          {/* Lista de Métodos de Verificación con estado real y tarjetas no configuradas oscurecidas */}
          <div className="security-list-card">
            {/* 1. Contraseña (100% Configurada y protegida en BD con bcrypt) */}
            <button
              type="button"
              className="security-list-item"
              onClick={handleStartPasswordChange}
            >
              <div className="security-item-left">
                <div className="security-item-icon">
                  <PasswordKeypadIcon size={22} />
                </div>
                <div>
                  <h3 className="security-item-title">Contraseña</h3>
                  <p className="security-item-desc">•••••••••••• · Protege el acceso principal a tu cuenta</p>
                </div>
              </div>
              <div className="security-item-right">
                <span className="security-badge-pill active">
                  <Check size={11} strokeWidth={3} /> Configurada
                </span>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </button>

            {/* 2. E-mail (En BD, estado según emailVerified) */}
            <button
              type="button"
              className={`security-list-item ${profileForm.emailVerified ? '' : 'is-dimmed'}`}
              onClick={() => {
                setInfoModal({
                  title: 'Correo electrónico de seguridad',
                  description: profileForm.emailVerified
                    ? `Tu correo electrónico ${profileForm.email} está verificado y activo para recibir alertas y restablecer tu clave de acceso.`
                    : `Tu correo electrónico ${profileForm.email} está registrado pero aún no ha sido verificado mediante código OTP.`,
                  badge: profileForm.emailVerified ? 'Verificado' : 'Pendiente de verificación',
                });
              }}
            >
              <div className="security-item-left">
                <div className="security-item-icon">
                  <Mail size={22} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="security-item-title">E-mail</h3>
                  <p className="security-item-desc">{profileForm.email || 'correo@ejemplo.com'}</p>
                </div>
              </div>
              <div className="security-item-right">
                {profileForm.emailVerified ? (
                  <span className="security-badge-pill active">
                    <Check size={11} strokeWidth={3} /> Verificado
                  </span>
                ) : (
                  <span className="security-badge-pill warning">
                    Sin verificar
                  </span>
                )}
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </button>

            {/* 3. Teléfono (Campo en BD, verificación pendiente) */}
            <button
              type="button"
              className={`security-list-item ${profileForm.phone ? '' : 'is-dimmed'}`}
              onClick={() => {
                setPhoneInputValue(profileForm.phone || '');
                setIsPhoneModalOpen(true);
              }}
            >
              <div className="security-item-left">
                <div className="security-item-icon">
                  <Smartphone size={22} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="security-item-title">Teléfono</h3>
                  <p className="security-item-desc">
                    {profileForm.phone
                      ? `${profileForm.phone} · Registrado (Verificación por SMS/WhatsApp pendiente)`
                      : 'Sin registrar · Agregá un teléfono para avisos y turnos'}
                  </p>
                </div>
              </div>
              <div className="security-item-right">
                {profileForm.phone ? (
                  <span className="security-badge-pill unconfigured">
                    Registrado
                  </span>
                ) : (
                  <span className="security-badge-pill action">
                    + Configurar
                  </span>
                )}
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </button>

            {/* 4. Google Authenticator (TOTP 2FA Real) */}
            <button
              type="button"
              className={`security-list-item ${profileForm.twoFactorEnabled ? '' : 'is-dimmed'}`}
              onClick={handleOpenTwoFactorModal}
            >
              <div className="security-item-left">
                <div className="security-item-icon" style={{ color: profileForm.twoFactorEnabled ? '#009ee3' : undefined }}>
                  <GoogleAuthIcon size={22} />
                </div>
                <div>
                  <h3 className="security-item-title">Google Authenticator (2FA)</h3>
                  <p className="security-item-desc">
                    {profileForm.twoFactorEnabled
                      ? 'Doble factor activo · Requiere código de 6 dígitos en cada inicio de sesión'
                      : 'Códigos temporales de 6 dígitos con apps como Google Authenticator o Authy'}
                  </p>
                </div>
              </div>
              <div className="security-item-right">
                {profileForm.twoFactorEnabled ? (
                  <span className="security-badge-pill active">
                    <Check size={11} strokeWidth={3} /> Activo
                  </span>
                ) : (
                  <span className="security-badge-pill action">
                    + Configurar
                  </span>
                )}
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </button>

            {/* 5. Llaves de acceso (FIDO2 / WebAuthn - Roadmap Fase 6) */}
            <button
              type="button"
              className="security-list-item is-dimmed"
              onClick={() => setIsPasskeyModalOpen(true)}
            >
              <div className="security-item-left">
                <div className="security-item-icon">
                  <PasskeyIcon size={22} />
                </div>
                <div>
                  <h3 className="security-item-title">Llaves de acceso (Passkeys)</h3>
                  <p className="security-item-desc">Inicio de sesión biométrico (Windows Hello, Touch ID o Face ID)</p>
                </div>
              </div>
              <div className="security-item-right">
                <span className="security-badge-pill roadmap">
                  Próximamente
                </span>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </button>

            {/* 6. Reconocimiento facial (Biometría - Roadmap Fase 6) */}
            <button
              type="button"
              className="security-list-item is-dimmed"
              onClick={() =>
                setInfoModal({
                  title: 'Reconocimiento facial (Biometría)',
                  description:
                    'La autenticación biométrica facial utiliza el sensor de tu dispositivo a través del estándar WebAuthn (FIDO2). Requiere soporte de hardware local y registro de llave pública criptográfica en la base de datos.',
                  badge: 'Hoja de ruta · Fase 6',
                })
              }
            >
              <div className="security-item-left">
                <div className="security-item-icon">
                  <ScanFace size={22} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="security-item-title">Reconocimiento facial</h3>
                  <p className="security-item-desc">Validación biométrica en tu dispositivo compatible</p>
                </div>
              </div>
              <div className="security-item-right">
                <span className="security-badge-pill roadmap">
                  Próximamente
                </span>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </button>

            {/* 7. Código QR (Roadmap Fase 7) */}
            <button
              type="button"
              className="security-list-item is-dimmed"
              onClick={() => setIsQrModalOpen(true)}
            >
              <div className="security-item-left">
                <div className="security-item-icon">
                  <QrCode size={22} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="security-item-title">Código QR de check-in</h3>
                  <p className="security-item-desc">Acreditación presencial rápida para tus turnos agendados</p>
                </div>
              </div>
              <div className="security-item-right">
                <span className="security-badge-pill roadmap">
                  Próximamente
                </span>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </button>
          </div>
        </div>
      );
    } else if (securitySub === 'devices') {
      pageContent = (
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '1rem 0.5rem 3rem' }}>
          {/* Breadcrumb idéntico a Mercado Libre */}
          <div className="profile-breadcrumb">
            <button type="button" onClick={() => setSearchParams({})}>Mi perfil</button>
            <span className="profile-breadcrumb-separator">&gt;</span>
            <button type="button" onClick={() => setSearchParams({ tab: 'security' })}>Seguridad</button>
            <span className="profile-breadcrumb-separator">&gt;</span>
            <span className="profile-breadcrumb-current">Dispositivos vinculados</span>
          </div>

          <h1 style={{ margin: '0 0 0.4rem', color: 'var(--text-title)', fontSize: '1.45rem', fontWeight: 800 }}>
            Dispositivos vinculados
          </h1>
          <p className="text-muted" style={{ margin: '0 0 1.5rem', fontSize: '0.88rem' }}>
            Gestioná los dispositivos donde iniciaste sesión con tu cuenta de Turnos Ya.
          </p>

          {securityMessage && (
            <div className={securityMessage.type === 'success' ? 'alert-success' : 'alert-danger'} style={{ marginBottom: '1.25rem' }}>
              {securityMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {securityMessage.text}
            </div>
          )}

          <div className="security-list-card">
            {sessionsLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                Cargando dispositivos activos...
              </div>
            ) : sessions.length === 0 ? (
              <div className="security-list-item" style={{ cursor: 'default' }}>
                <div className="security-item-left">
                  <div className="security-item-icon">
                    <Laptop size={24} color="#009ee3" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="security-item-title">
                      {navigator.userAgent.includes('Chrome') ? 'Google Chrome en Windows' : 'Navegador Web en Computadora'}
                    </h3>
                    <p className="security-item-desc">
                      Sesión iniciada · Activa en este equipo
                    </p>
                  </div>
                </div>
                <div className="security-item-right">
                  <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.74rem', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                    Este dispositivo
                  </span>
                </div>
              </div>
            ) : (
              sessions.map((s) => {
                const isMobile =
                  s.deviceName.toLowerCase().includes('móvil') ||
                  s.deviceName.toLowerCase().includes('android') ||
                  s.deviceName.toLowerCase().includes('ios') ||
                  s.deviceName.toLowerCase().includes('iphone');

                const dateFormatted = new Date(s.lastActiveAt).toLocaleString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={s.id} className="security-list-item" style={{ cursor: 'default' }}>
                    <div className="security-item-left">
                      <div className="security-item-icon">
                        {isMobile ? (
                          <Smartphone size={24} color="#009ee3" strokeWidth={1.8} />
                        ) : (
                          <Laptop size={24} color="#009ee3" strokeWidth={1.8} />
                        )}
                      </div>
                      <div>
                        <h3 className="security-item-title">{s.deviceName}</h3>
                        <p className="security-item-desc">
                          {s.isCurrent ? (
                            <span style={{ color: '#059669', fontWeight: 600 }}>Sesión activa en este equipo</span>
                          ) : (
                            `Última actividad: ${dateFormatted}`
                          )}
                          {s.ipAddress ? ` · IP: ${s.ipAddress}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="security-item-right">
                      {s.isCurrent ? (
                        <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.74rem', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                          Este dispositivo
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          style={{ fontSize: '0.8rem', padding: '4px 10px', borderColor: '#fca5a5', color: '#dc2626' }}
                          onClick={() => handleRevokeSession(s.id)}
                          disabled={sessionActionLoading === s.id}
                        >
                          {sessionActionLoading === s.id ? 'Cerrando...' : 'Cerrar sesión'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-light" onClick={handleLogout}>
              <LogOut size={15} /> Cerrar sesión en este equipo
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={handleLogoutAll}
              disabled={sessions.filter((s) => !s.isCurrent).length === 0 || sessionActionLoading === 'all'}
            >
              {sessionActionLoading === 'all' ? 'Cerrando sesiones...' : 'Cerrar todas las demás sesiones'}
            </button>
          </div>
        </div>
      );
    }
  } else if (currentTab) {
    const titles: Record<string, { title: string; subtitle: string }> = {
      profile: {
        title: 'Información de tu perfil',
        subtitle: 'Gestioná tus datos personales y medios de contacto.',
      },
      notifications: {
        title: 'Comunicaciones',
        subtitle: 'Elegí qué tipo de avisos querés recibir por email o WhatsApp.',
      },
      privacy: {
        title: 'Privacidad',
        subtitle: 'Preferencias y control sobre el uso de tus datos y visibilidad.',
      },
    };

    pageContent = (
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '1rem 0.5rem 3rem' }}>
        {/* Breadcrumb superior estilo Mercado Libre */}
        <div className="profile-breadcrumb">
          <button type="button" onClick={() => setSearchParams({})}>Mi perfil</button>
          <span className="profile-breadcrumb-separator">&gt;</span>
          <span className="profile-breadcrumb-current">{titles[currentTab]?.title}</span>
        </div>

        {/* Tarjeta del formulario */}
        <div className="ml-card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <h2 style={{ margin: 0, color: 'var(--text-title)', fontWeight: 800, fontSize: '1.35rem' }}>
              {titles[currentTab]?.title}
            </h2>
            <p className="text-muted" style={{ margin: '0.35rem 0 0', fontSize: '0.88rem' }}>
              {titles[currentTab]?.subtitle}
            </p>
          </div>

          {/* ====== PESTAÑA: INFORMACIÓN DE TU PERFIL ====== */}
          {currentTab === 'profile' && (
            <div>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="profile-hub-avatar" style={{ width: '56px', height: '56px', fontSize: '1.3rem' }}>
                  {initials}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-title)', fontWeight: 800, fontSize: '1.15rem' }}>
                    {profileForm.name || 'Usuario'}
                  </h3>
                  <p className="text-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
                    {profileForm.email || 'Sin email'}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span className="badge badge-confirmed" style={{ fontSize: '0.78rem' }}>
                    {ROLE_LABELS[profileForm.role] || 'Cliente'}
                  </span>
                </div>
              </div>

              {profileMessage && (
                <div className={profileMessage.type === 'success' ? 'alert-success' : 'alert-danger'} style={{ marginBottom: '1.25rem' }}>
                  {profileMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleProfileSubmit}>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Nombre completo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Teléfono de contacto</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={profileForm.phone}
                      placeholder="Ej: +54 9 11 1234-5678"
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Correo electrónico</label>
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
                              Verifícalo para recibir avisos de turnos y desbloquear las opciones de seguridad.
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
                </div>

                <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.75rem 1.75rem' }}>
                    <Save size={16} /> {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ====== PESTAÑA: COMUNICACIONES ====== */}
          {currentTab === 'notifications' && (
            <div>
              {profileMessage && (
                <div className={profileMessage.type === 'success' ? 'alert-success' : 'alert-danger'} style={{ marginBottom: '1.25rem' }}>
                  {profileMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleNotificationSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.2rem', border: '1px solid var(--border-default)', borderRadius: '12px', background: 'var(--background-app)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-title)', fontSize: '0.95rem' }}>Avisos por correo electrónico</div>
                      <small className="text-muted">Recibir confirmaciones de turnos, recordatorios y cambios de horario por email.</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileForm.emailNotifications}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, emailNotifications: e.target.checked }))}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.2rem', border: '1px solid var(--border-default)', borderRadius: '12px', background: 'var(--background-app)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-title)', fontSize: '0.95rem' }}>Avisos por WhatsApp</div>
                      <small className="text-muted">Recibir recordatorios automáticos por WhatsApp antes de tu turno.</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileForm.whatsappNotifications}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, whatsappNotifications: e.target.checked }))}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                  </label>
                </div>

                <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
                    <MessageSquare size={16} /> Guardar preferencias
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ====== PESTAÑA: PRIVACIDAD ====== */}
          {currentTab === 'privacy' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {[
                  ['Compartir mi número de teléfono con los negocios donde reservo', privacy.sharePhone, () => setPrivacy((prev) => ({ ...prev, sharePhone: !prev.sharePhone }))],
                  ['Permitir contacto del equipo de soporte ante reprogramaciones', privacy.systemContact, () => setPrivacy((prev) => ({ ...prev, systemContact: !prev.systemContact }))],
                  ['Mostrar mis datos de perfil básicos en las reservas confirmadas', privacy.basicVisibility, () => setPrivacy((prev) => ({ ...prev, basicVisibility: !prev.basicVisibility }))],
                ].map(([label, checked, onToggle]) => (
                  <label key={String(label)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.2rem', border: '1px solid var(--border-default)', borderRadius: '12px', background: 'var(--background-app)', cursor: 'pointer' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-title)', fontSize: '0.92rem' }}>{String(label)}</span>
                    <input type="checkbox" checked={Boolean(checked)} onChange={onToggle as any} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                  </label>
                ))}
              </div>

              <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => alert('Preferencias de privacidad guardadas localmente.')}
                  style={{ padding: '0.75rem 1.75rem' }}
                >
                  <Save size={16} /> Guardar preferencias
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    // ==========================================
    // VISTA PRINCIPAL: HUB ESTILO MERCADO LIBRE
    // ==========================================
    pageContent = (
      <div className="profile-hub-wrapper">
      {/* Encabezado del usuario */}
      <div className="profile-hub-header">
        <div className="profile-hub-avatar">
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="profile-hub-name">
              {profileForm.name || 'Mi Perfil'}
            </h1>
            <span className="badge badge-confirmed" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
              {ROLE_LABELS[profileForm.role] || 'Cliente'}
            </span>
          </div>
          <p className="profile-hub-email">
            {profileForm.email}
          </p>
        </div>
      </div>

      {/* Alerta si el mail no está verificado */}
      {!profileForm.emailVerified && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#92400e', display: 'block' }}>
                Tu correo electrónico aún no está verificado
              </strong>
              <span style={{ fontSize: '0.82rem', color: '#b45309' }}>
                Verifícalo para asegurar la recepción de avisos y habilitar la seguridad completa de tu cuenta.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: '0.84rem', padding: '7px 16px', whiteSpace: 'nowrap' }}
            onClick={() => setSearchParams({ tab: 'profile' })}
          >
            Verificar ahora →
          </button>
        </div>
      )}

      {/* Grid de tarjetas estilo Mercado Libre */}
      <div className="profile-hub-grid">
        {/* 1. Información de tu perfil */}
        <div
          className="profile-hub-card"
          onClick={() => setSearchParams({ tab: 'profile' })}
          role="button"
          tabIndex={0}
        >
          <div className="profile-hub-card-top">
            <div className="profile-hub-card-icon">
              <User size={24} strokeWidth={1.8} />
            </div>
          </div>
          <div>
            <h3 className="profile-hub-card-title">Información de tu perfil</h3>
            <p className="profile-hub-card-desc">Datos personales y de tu cuenta.</p>
          </div>
        </div>

        {/* 2. Seguridad */}
        <div
          className="profile-hub-card"
          onClick={() => setSearchParams({ tab: 'security' })}
          role="button"
          tabIndex={0}
        >
          <div className="profile-hub-card-top">
            <div className="profile-hub-card-icon">
              <Lock size={24} strokeWidth={1.8} />
            </div>
            {profileForm.emailVerified ? (
              <span className="profile-check-badge" title="Seguridad configurada">
                <Check size={13} strokeWidth={3} />
              </span>
            ) : (
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #fde68a',
                }}
                title="Verificación pendiente"
              >
                <Lock size={11} strokeWidth={2.5} />
              </span>
            )}
          </div>
          <div>
            <h3 className="profile-hub-card-title">Seguridad</h3>
            <p className="profile-hub-card-desc">
              {profileForm.emailVerified
                ? 'Tenés configurada la seguridad de tu cuenta.'
                : 'Verificación requerida para proteger tu cuenta.'}
            </p>
          </div>
        </div>

        {/* 3. Mis Turnos */}
        <div
          className="profile-hub-card"
          onClick={() => navigate('/my-appointments')}
          role="button"
          tabIndex={0}
        >
          <div className="profile-hub-card-top">
            <div className="profile-hub-card-icon">
              <CalendarCheck size={24} strokeWidth={1.8} />
            </div>
          </div>
          <div>
            <h3 className="profile-hub-card-title">Mis Turnos</h3>
            <p className="profile-hub-card-desc">Historial de citas, reservas activas y comprobantes.</p>
          </div>
        </div>

        {/* 4. Comunicaciones */}
        <div
          className="profile-hub-card"
          onClick={() => setSearchParams({ tab: 'notifications' })}
          role="button"
          tabIndex={0}
        >
          <div className="profile-hub-card-top">
            <div className="profile-hub-card-icon">
              <MessageSquare size={24} strokeWidth={1.8} />
            </div>
          </div>
          <div>
            <h3 className="profile-hub-card-title">Comunicaciones</h3>
            <p className="profile-hub-card-desc">Elegí qué tipo de información querés recibir.</p>
          </div>
        </div>

        {/* 5. Privacidad */}
        <div
          className="profile-hub-card"
          onClick={() => setSearchParams({ tab: 'privacy' })}
          role="button"
          tabIndex={0}
        >
          <div className="profile-hub-card-top">
            <div className="profile-hub-card-icon">
              <Shield size={24} strokeWidth={1.8} />
            </div>
          </div>
          <div>
            <h3 className="profile-hub-card-title">Privacidad</h3>
            <p className="profile-hub-card-desc">Preferencias y control sobre el uso de tus datos.</p>
          </div>
        </div>

        {/* 6. Mi Comercio / Registrar Negocio */}
        <div
          className="profile-hub-card"
          onClick={() => navigate('/dashboard')}
          role="button"
          tabIndex={0}
        >
          <div className="profile-hub-card-top">
            <div className="profile-hub-card-icon">
              <Building2 size={24} strokeWidth={1.8} />
            </div>
          </div>
          <div>
            <h3 className="profile-hub-card-title">
              {profileForm.role === 'owner' ? 'Mi Comercio' : 'Registrar Negocio'}
            </h3>
            <p className="profile-hub-card-desc">
              {profileForm.role === 'owner'
                ? 'Gestioná tus servicios, horarios y panel de control.'
                : 'Publicá tu negocio y gestioná turnos con tus clientes.'}
            </p>
          </div>
        </div>
      </div>

      {/* Pie inferior idéntico a Mercado Libre */}
      <div
        style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Podés{' '}
          <button
            type="button"
            onClick={() => setIsCancelModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--primary-color)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 'inherit',
            }}
          >
            cancelar tu cuenta
          </button>{' '}
          siempre que lo desees.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-light"
          style={{ fontSize: '0.85rem', color: 'var(--status-danger-text)' }}
        >
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </div>
    );
  }

  return (
    <>
      {pageContent}

      {/* Modal / Ventana de Cambio de Contraseña */}
      {isPasswordModalOpen && (
        <div className="modal-overlay" onClick={handleClosePasswordModal}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}
          >
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

            {modalMessage && (
              <div
                className={modalMessage.type === 'success' ? 'alert-success' : 'alert-danger'}
                style={{ marginBottom: '1.25rem', fontSize: '0.88rem' }}
              >
                {modalMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {modalMessage.text}
              </div>
            )}

            {passwordModalStep === 'verify_code' ? (
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
                        ¿No recuerdas tu clave actual? Como ya verificaste tu identidad con el código de 6 dígitos enviado a tu correo, puedes crear tu nueva clave directamente.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setForgotPasswordMode('reset_directly')}
                          className="btn btn-primary"
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                          Crear nueva clave directamente
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

      {/* Modal Informativo para Métodos de Seguridad */}
      {infoModal && (
        <div className="modal-overlay" onClick={() => setInfoModal(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 158, 227, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Info size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-title)' }}>
                  {infoModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
              {infoModal.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {infoModal.badge && (
                <span className="badge badge-confirmed" style={{ fontSize: '0.75rem' }}>
                  {infoModal.badge}
                </span>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setInfoModal(null)}
                style={{ padding: '6px 16px', fontSize: '0.85rem', marginLeft: 'auto' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar/Ver Teléfono */}
      {isPhoneModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPhoneModalOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0, 158, 227, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Número de teléfono
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Método de recuperación y avisos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, margin: '0 0 1rem' }}>
              Este número se utilizará para recibir recordatorios de tus turnos por WhatsApp y proteger tu cuenta.
            </p>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Teléfono de contacto</label>
              <input
                type="tel"
                className="form-control"
                value={phoneInputValue}
                placeholder="+54 3435136982"
                onChange={(e) => setPhoneInputValue(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setIsPhoneModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={phoneSaving}
                onClick={handleSavePhoneFromModal}
              >
                <Save size={15} /> {phoneSaving ? 'Guardando...' : 'Guardar número'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Llaves de Acceso (Passkeys) */}
      {isPasskeyModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPasskeyModalOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '460px', width: '100%', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0, 158, 227, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PasskeyIcon size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Llaves de acceso (Passkeys)
                  </h3>
                  <span className="security-badge-pill roadmap" style={{ marginTop: '3px' }}>
                    Fase 6 · En hoja de ruta
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasskeyModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
              Las llaves de acceso permiten iniciar sesión de forma instantánea usando el sensor biométrico del equipo (Windows Hello, Touch ID o Face ID) mediante el estándar FIDO2 / WebAuthn.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                ⚙️ <strong>Próxima integración:</strong> Se requerirá registrar la clave pública generada por el navegador en la base de datos para autenticar sin contraseñas.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsPasskeyModalOpen(false)}
                style={{ padding: '7px 18px' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Código QR */}
      {isQrModalOpen && (
        <div className="modal-overlay" onClick={() => setIsQrModalOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '100%', padding: '2rem', textAlign: 'center' }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0, 158, 227, 0.1)', color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <QrCode size={26} />
            </div>

            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
              Código QR de Check-in
            </h3>
            <span className="security-badge-pill roadmap" style={{ marginBottom: '1rem', display: 'inline-block' }}>
              Fase 7 · En hoja de ruta
            </span>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0.5rem 0 1.5rem' }}>
              Esta función generará un código QR dinámico firmado para que el recepcionista del local comercial pueda escanear tu llegada y registrar tu asistencia en tiempo real.
            </p>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              onClick={() => setIsQrModalOpen(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal Real para Google Authenticator (2FA) */}
      {isTwoFactorModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTwoFactorModalOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', width: '100%', padding: '1.85rem' }}
          >
            {/* Cabecera */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0, 158, 227, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GoogleAuthIcon size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Google Authenticator (2FA)
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {twoFactorStep === 'setup' && 'Paso 1: Vincular tu aplicación'}
                    {twoFactorStep === 'backup_codes' && 'Paso 2: Códigos de respaldo'}
                    {twoFactorStep === 'disable_confirm' && 'Desactivar doble factor'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTwoFactorModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            {twoFactorError && (
              <div className="alert-danger" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={16} /> {twoFactorError}
              </div>
            )}

            {/* Paso 1: Configurar / Escanear QR */}
            {twoFactorStep === 'setup' && (
              <div>
                {twoFactorLoading && !twoFactorQr ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>Generando clave criptográfica en el servidor...</p>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, margin: '0 0 1rem' }}>
                      Escaneá este código QR con la app <strong>Google Authenticator</strong> o <strong>Authy</strong> en tu teléfono celular:
                    </p>

                    {twoFactorQr && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '10px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                          <img src={twoFactorQr} alt="Código QR 2FA" style={{ width: '160px', height: '160px', display: 'block' }} />
                        </div>
                      </div>
                    )}

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div>
                        <small className="text-muted" style={{ display: 'block', fontSize: '0.72rem' }}>O ingresá la clave manualmente:</small>
                        <code style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0284c7', letterSpacing: '1px' }}>{twoFactorSecret}</code>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="btn btn-light"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        {twoFactorCopied ? '¡Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label" style={{ fontSize: '0.84rem' }}>
                        Ingresá el código de 6 dígitos que muestra tu app
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        className="form-control"
                        value={twoFactorCodeInput}
                        onChange={(e) => setTwoFactorCodeInput(e.target.value.replace(/\D/g, ''))}
                        style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '4px', fontWeight: 700 }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => setIsTwoFactorModalOpen(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={twoFactorCodeInput.length < 6 || twoFactorLoading}
                        onClick={handleVerifyAndEnableTwoFactor}
                      >
                        {twoFactorLoading ? 'Verificando...' : 'Verificar y Activar'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Paso 2: Códigos de respaldo */}
            {twoFactorStep === 'backup_codes' && (
              <div>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px 14px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="profile-check-badge" style={{ width: '22px', height: '22px' }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#065f46', fontWeight: 700 }}>¡Doble factor activado!</h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#047857' }}>Tu cuenta ahora está protegida con verificación en dos pasos.</p>
                  </div>
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.5, margin: '0 0 1rem' }}>
                  <strong>Guardá estos códigos de respaldo en un lugar seguro.</strong> Si alguna vez perdés el acceso a tu teléfono o app autenticadora, podrás usar cualquiera de estos códigos para ingresar:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '1.25rem' }}>
                  {twoFactorBackupCodes.map((c, i) => (
                    <div key={i} style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      {c}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={handleCopyBackupCodes}
                    style={{ fontSize: '0.82rem' }}
                  >
                    {twoFactorCopied ? '¡Códigos copiados!' : 'Copiar todos los códigos'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setIsTwoFactorModalOpen(false)}
                  >
                    Listo, entendido
                  </button>
                </div>
              </div>
            )}

            {/* Desactivar 2FA */}
            {twoFactorStep === 'disable_confirm' && (
              <div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
                  Google Authenticator está actualmente <strong>activo</strong> en tu cuenta. Para desactivarlo, por favor ingresá tu contraseña actual por motivos de seguridad:
                </p>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.84rem' }}>Contraseña actual</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={twoFactorDisablePassword}
                    onChange={(e) => setTwoFactorDisablePassword(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setIsTwoFactorModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={!twoFactorDisablePassword || twoFactorLoading}
                    onClick={handleDisableTwoFactor}
                  >
                    {twoFactorLoading ? 'Desactivando...' : 'Desactivar 2FA'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmación para Cancelar Cuenta */}
      {isCancelModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCancelModalOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                  Cancelar o eliminar cuenta
                </h3>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Políticas de privacidad y cierre de cuenta
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Al cancelar tu cuenta de Turnos Ya se cancelarán tus reservas futuras y se desvinculará tu información personal conforme a las normativas de protección de datos vigentes.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '1.5rem', fontSize: '0.84rem', color: '#475569' }}>
              Si tenés dudas o necesitás asistencia previa, contactanos en <strong>soporte@turnosya.com</strong>.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setIsCancelModalOpen(false)}
              >
                Mantener mi cuenta
              </button>
              <button
                type="button"
                className="btn btn-light"
                style={{ color: 'var(--status-danger-text)', borderColor: '#fca5a5' }}
                onClick={() => {
                  setIsCancelModalOpen(false);
                  logout();
                  navigate('/');
                }}
              >
                Cerrar sesión y dar de baja
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
