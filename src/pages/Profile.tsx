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
  Info,
  MonitorSmartphone,
  ArrowLeft,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Heart,
  Bell,
  BellOff,
  ExternalLink,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { startSmoothNavigation } from '../utils/transitionNavigator';
import { openLegalModal } from '../services/legalModalService';

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

type ActiveTab = 'profile' | 'security' | 'notifications' | 'privacy' | 'favorites';

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

  // Tab activo y subsección sincronizados en estado local para permitir a flushSync sincronizar el DOM de inmediato
  const [activeTab, setActiveTab] = useState<ActiveTab | null>(() => searchParams.get('tab') as ActiveTab | null);
  const [activeSub, setActiveSub] = useState<string>(() => searchParams.get('sub') || 'menu');

  // Sincronizar estado local si el usuario navega con botones Adelante/Atrás del navegador o links externos
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as ActiveTab | null;
    const subFromUrl = searchParams.get('sub') || 'menu';
    setActiveTab(tabFromUrl);
    setActiveSub(subFromUrl);
  }, [searchParams]);

  const currentTab = activeTab;
  const securitySub = activeSub;

  // Nivel de profundidad para determinar la dirección de la transición
  const getDepth = (tab: ActiveTab | null, sub: string): number => {
    if (!tab) return 0; // Hub principal
    if (tab === 'security' && (sub === 'methods' || sub === 'devices')) return 2; // Sub-secciones de seguridad
    return 1; // Sub-vistas nivel 1
  };

  const currentDepth = getDepth(currentTab, securitySub);

  // Navegación con View Transitions interna de Profile (coexistencia perfecta de capas sin pantalla en blanco)
  const navigateProfileTab = (targetTab: ActiveTab | null, targetSub: string = 'menu') => {
    const nextDepth = getDepth(targetTab, targetSub);
    const direction = nextDepth < currentDepth ? 'backward' : 'forward';

    // Establecer dirección para las keyframes nativas de View Transitions
    document.documentElement.dataset.transitionDir = direction;

    const performSyncDOMUpdate = () => {
      // 1. Actualizar estado local síncronamente forzado por flushSync
      setActiveTab(targetTab);
      setActiveSub(targetSub);
      // 2. Sincronizar URL de React Router en segundo plano
      if (!targetTab) {
        setSearchParams({}, { replace: false });
      } else if (targetSub && targetSub !== 'menu') {
        setSearchParams({ tab: targetTab, sub: targetSub }, { replace: false });
      } else {
        setSearchParams({ tab: targetTab }, { replace: false });
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };

    const doc = document as any;
    if (typeof doc !== 'undefined' && typeof doc.startViewTransition === 'function') {
      const vt = doc.startViewTransition(() => {
        flushSync(() => {
          performSyncDOMUpdate();
        });
      });
      if (vt && typeof vt.finished?.then === 'function') {
        vt.finished.finally(() => {
          delete document.documentElement.dataset.transitionDir;
        });
      }
    } else {
      performSyncDOMUpdate();
    }
  };

  const [profileForm, setProfileForm] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone && !user.phone.includes('3435') ? user.phone : '',
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
  const [passwordModalStep, setPasswordModalStep] = useState<'no_methods' | 'choose_method' | 'verify_email' | 'verify_2fa' | 'set_passwords'>('verify_email');
  const [changeToken, setChangeToken] = useState<string | null>(null);
  const [changeAuthToken, setChangeAuthToken] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFactorPasswordCode, setTwoFactorPasswordCode] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal de cancelación de cuenta
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Modal informativo de métodos de seguridad
  const [infoModal, setInfoModal] = useState<{
    title: string;
    description: string;
    badge?: string;
  } | null>(null);

  // Modales interactivos específicos para métodos de seguridad
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneInputValue, setPhoneInputValue] = useState(
    profileForm.phone && !profileForm.phone.includes('3435') ? profileForm.phone : ''
  );
  const [phoneSaving, setPhoneSaving] = useState(false);

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

  const handleOpenTwoFactorModal = async (forceReset?: boolean | React.MouseEvent) => {
    const shouldReset = forceReset === true;
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
        const url = shouldReset ? '/auth/2fa/setup?reset=true' : '/auth/2fa/setup';
        const res = await api.get(url);
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
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);

  const [privacy, setPrivacy] = useState<PrivacySettings>(() => {
    try {
      const saved = localStorage.getItem('turnos_ya_privacy_prefs');
      return saved ? { ...defaultPrivacy, ...JSON.parse(saved) } : defaultPrivacy;
    } catch {
      return defaultPrivacy;
    }
  });

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

  // Estados de Comercios Favoritos y Preferencias de Avisos por Negocio
  interface FollowedBusinessItem {
    id: number;
    businessId: number;
    receiveNotifications: boolean;
    createdAt: string;
    business?: {
      id: number;
      name: string;
      category?: string;
      address?: string;
    };
  }
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<FollowedBusinessItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const loadFavoriteBusinesses = async () => {
    if (!user) return;
    setLoadingFavorites(true);
    try {
      const res = await api.get('/businesses/my/favorites');
      const list = res.data?.data ?? res.data ?? [];
      setFavoriteBusinesses(Array.isArray(list) ? list : []);
    } catch {
      // silencioso
    } finally {
      setLoadingFavorites(false);
    }
  };

  useEffect(() => {
    loadFavoriteBusinesses();
  }, [user]);

  useEffect(() => {
    if (currentTab === 'favorites' || currentTab === 'notifications') {
      loadFavoriteBusinesses();
    }
  }, [currentTab]);

  const handleToggleFavBusinessNotifications = async (businessId: number, currentVal: boolean) => {
    const nextVal = !currentVal;
    setFavoriteBusinesses(prev =>
      prev.map(item => item.businessId === businessId ? { ...item, receiveNotifications: nextVal } : item)
    );
    try {
      await api.patch(`/businesses/${businessId}/follow/notifications`, {
        receiveNotifications: nextVal,
      });
    } catch {
      setFavoriteBusinesses(prev =>
        prev.map(item => item.businessId === businessId ? { ...item, receiveNotifications: currentVal } : item)
      );
    }
  };

  const handleUnfollowBusinessFromProfile = async (businessId: number) => {
    try {
      await api.post(`/businesses/${businessId}/follow`);
      setFavoriteBusinesses(prev => prev.filter(item => item.businessId !== businessId));
    } catch {
      // silencioso
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
        phone: freshUser.phone && !freshUser.phone.includes('3435') ? freshUser.phone : '',
        role: freshUser.role || '',
        emailVerified: freshUser.emailVerified ?? false,
        emailNotifications: freshUser.emailNotifications ?? true,
        whatsappNotifications: freshUser.whatsappNotifications ?? false,
        twoFactorEnabled: freshUser.twoFactorEnabled ?? false,
      });

      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        if (freshUser.phone && freshUser.phone.includes('3435')) {
          freshUser.phone = null;
        }
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
    setTwoFactorPasswordCode('');
    setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setForgotPasswordActive(false);
    setForgotPasswordMode('email_link');

    const hasEmail = Boolean(profileForm.emailVerified);
    const has2FA = Boolean(profileForm.twoFactorEnabled);

    if (!hasEmail && !has2FA) {
      setPasswordModalStep('no_methods');
      setIsPasswordModalOpen(true);
      setSecurityLoading(false);
      return;
    }

    if (hasEmail && has2FA) {
      setPasswordModalStep('choose_method');
      setIsPasswordModalOpen(true);
      setSecurityLoading(false);
      return;
    }

    if (has2FA && !hasEmail) {
      setPasswordModalStep('verify_2fa');
      setIsPasswordModalOpen(true);
      setSecurityLoading(false);
      return;
    }

    // Only email verified
    try {
      const res = await api.post('/auth/request-password-change-code');
      setChangeToken(res.data.confirmationToken);
      setPasswordModalStep('verify_email');
      setIsPasswordModalOpen(true);
    } catch (err: any) {
      setSecurityMessage({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo enviar el código de verificación por correo.',
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleChooseEmailMethod = async () => {
    setSecurityLoading(true);
    setModalMessage(null);
    try {
      const res = await api.post('/auth/request-password-change-code');
      setChangeToken(res.data.confirmationToken);
      setPasswordModalStep('verify_email');
    } catch (err: any) {
      setModalMessage({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo enviar el código por correo.',
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleChoose2FAMethod = () => {
    setModalMessage(null);
    setTwoFactorPasswordCode('');
    setPasswordModalStep('verify_2fa');
  };

  const handleVerifyPassword2FACode = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalMessage(null);

    const clean = twoFactorPasswordCode.trim();
    if (clean.length < 6) {
      setModalMessage({ type: 'error', text: 'Ingresa el código de 6 dígitos de Google Authenticator o código de respaldo.' });
      return;
    }

    setSecurityLoading(true);
    try {
      const res = await api.post('/auth/verify-password-change-2fa', { code: clean });
      setChangeAuthToken(res.data.changeAuthToken);
      setPasswordModalStep('set_passwords');
      setModalMessage({
        type: 'success',
        text: 'Identidad verificada exitosamente. Ya puedes ingresar tu nueva contraseña.',
      });
    } catch (err: any) {
      setModalMessage({
        type: 'error',
        text: err.response?.data?.message || 'Código de Authenticator incorrecto o expirado.',
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleStartEmailFromModal = () => {
    setIsPasswordModalOpen(false);
    navigateProfileTab('profile');
    handleSendVerificationEmail();
  };

  const handleStart2FAFromModal = () => {
    setIsPasswordModalOpen(false);
    handleOpenTwoFactorModal();
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
    setTwoFactorPasswordCode('');
    setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setChangeToken(null);
    setChangeAuthToken(null);
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
        <div className="profile-subview-container" key="subview-security-menu">
          {/* Barra de navegación ergonómica y retroceso táctil */}
          <div className="profile-nav-header-wrap">
            <button
              type="button"
              className="profile-back-btn"
              onClick={() => navigateProfileTab(null)}
              aria-label="Volver a Mi perfil"
            >
              <ArrowLeft size={18} />
              <span>Volver a Mi perfil</span>
            </button>
            <div className="profile-breadcrumb">
              <button type="button" onClick={() => navigateProfileTab(null)}>Mi perfil</button>
              <span className="profile-breadcrumb-separator">&gt;</span>
              <span className="profile-breadcrumb-current">Seguridad</span>
            </div>
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
              onClick={() => navigateProfileTab('security', 'methods')}
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
              onClick={() => navigateProfileTab('security', 'devices')}
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
        <div className="profile-subview-container" key="subview-security-methods">
          {/* Barra de navegación ergonómica y retroceso táctil */}
          <div className="profile-nav-header-wrap">
            <button
              type="button"
              className="profile-back-btn"
              onClick={() => navigateProfileTab('security', 'menu')}
              aria-label="Volver a Seguridad"
            >
              <ArrowLeft size={18} />
              <span>Volver a Seguridad</span>
            </button>
            <div className="profile-breadcrumb">
              <button type="button" onClick={() => navigateProfileTab(null)}>Mi perfil</button>
              <span className="profile-breadcrumb-separator">&gt;</span>
              <button type="button" onClick={() => navigateProfileTab('security', 'menu')}>Seguridad</button>
              <span className="profile-breadcrumb-separator">&gt;</span>
              <span className="profile-breadcrumb-current">Métodos de verificación</span>
            </div>
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
                const cleanPhone = profileForm.phone && !profileForm.phone.includes('3435') ? profileForm.phone : '';
                setPhoneInputValue(cleanPhone);
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
          </div>
        </div>
      );
    } else if (securitySub === 'devices') {
      pageContent = (
        <div className="profile-subview-container" key="subview-security-devices">
          {/* Barra de navegación ergonómica y retroceso táctil */}
          <div className="profile-nav-header-wrap">
            <button
              type="button"
              className="profile-back-btn"
              onClick={() => navigateProfileTab('security', 'menu')}
              aria-label="Volver a Seguridad"
            >
              <ArrowLeft size={18} />
              <span>Volver a Seguridad</span>
            </button>
            <div className="profile-breadcrumb">
              <button type="button" onClick={() => navigateProfileTab(null)}>Mi perfil</button>
              <span className="profile-breadcrumb-separator">&gt;</span>
              <button type="button" onClick={() => navigateProfileTab('security', 'menu')}>Seguridad</button>
              <span className="profile-breadcrumb-separator">&gt;</span>
              <span className="profile-breadcrumb-current">Dispositivos vinculados</span>
            </div>
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

          <div className="devices-actions-row">
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
        subtitle: 'Elegí qué tipo de avisos querés recibir en la plataforma o por correo electrónico.',
      },
      privacy: {
        title: 'Privacidad',
        subtitle: 'Preferencias y control sobre el uso de tus datos y visibilidad.',
      },
      favorites: {
        title: 'Mis Comercios Favoritos',
        subtitle: 'Administrá los comercios que seguís y configurá alertas de promociones o cierres por feriado.',
      },
    };

    pageContent = (
      <div className="profile-subview-container" key={`subview-${currentTab}`}>
        {/* Barra de navegación ergonómica y retroceso táctil */}
        <div className="profile-nav-header-wrap">
          <button
            type="button"
            className="profile-back-btn"
            onClick={() => navigateProfileTab(null)}
            aria-label="Volver a Mi perfil"
          >
            <ArrowLeft size={18} />
            <span>Volver a Mi perfil</span>
          </button>
          <div className="profile-breadcrumb">
            <button type="button" onClick={() => navigateProfileTab(null)}>Mi perfil</button>
            <span className="profile-breadcrumb-separator">&gt;</span>
            <span className="profile-breadcrumb-current">{titles[currentTab]?.title}</span>
          </div>
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

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.2rem', border: '1px solid var(--border-default)', borderRadius: '12px', background: '#f8fafc' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-title)', fontSize: '0.95rem' }}>Notificaciones en la plataforma (Campanita)</div>
                      <small className="text-muted">Avisos instantáneos dentro de Turnos Ya sobre el estado de tus reservas, tickets y comercios.</small>
                    </div>
                    <span className="badge badge-confirmed" style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap' }}>
                      Siempre activas
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
                    <MessageSquare size={16} /> Guardar preferencias
                  </button>
                </div>
              </form>

              <div className="divider" style={{ margin: '2rem 0 1.5rem' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '0.85rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Heart size={16} color="#e11d48" fill="#e11d48" /> Avisos por Comercio Seguido ({favoriteBusinesses.length})
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Elegí de qué comercios querés recibir avisos de promociones, turnos liberados o cierres por feriado.
                  </p>
                </div>
              </div>

              {favoriteBusinesses.length === 0 ? (
                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.86rem', color: '#64748b' }}>
                    Todavía no seguís a ningún comercio. Tocá el corazón ❤️ en tus locales favoritos para recibir sus novedades.
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => startSmoothNavigation(navigate, '/')}
                  >
                    Explorar comercios
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {favoriteBusinesses.map(fav => (
                    <div
                      key={fav.businessId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: '1 1 180px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-title)' }}>
                          {fav.business?.name || `Comercio #${fav.businessId}`}
                        </div>
                        {fav.business?.category && (
                          <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                            {fav.business.category}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFavBusinessNotifications(fav.businessId, fav.receiveNotifications)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: fav.receiveNotifications ? '1px solid #bae6fd' : '1px solid #cbd5e1',
                          background: fav.receiveNotifications ? '#f0f9ff' : '#f8fafc',
                          color: fav.receiveNotifications ? '#0284c7' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        {fav.receiveNotifications ? <Bell size={14} /> : <BellOff size={14} />}
                        <span>{fav.receiveNotifications ? 'Avisos activos' : 'Silenciado'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====== PESTAÑA: MIS COMERCIOS FAVORITOS ====== */}
          {currentTab === 'favorites' && (
            <div>
              {loadingFavorites ? (
                <p className="text-muted text-sm">Cargando tus comercios favoritos...</p>
              ) : favoriteBusinesses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
                  <Heart size={42} color="#fda4af" style={{ marginBottom: '0.75rem' }} />
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Aún no tenés comercios en Favoritos
                  </h3>
                  <p className="text-muted text-sm" style={{ maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                    Seguí a tus peluquerías, consultorios o centros favoritos para reservar en 1 toque y enterarte de promociones o cierres por feriado.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => startSmoothNavigation(navigate, '/')}
                  >
                    Explorar comercios
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {favoriteBusinesses.map(fav => (
                    <div
                      key={fav.businessId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.85rem',
                        padding: '1rem 1.15rem',
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '1rem', color: 'var(--text-title)', fontWeight: 800 }}>
                            {fav.business?.name || `Comercio #${fav.businessId}`}
                          </strong>
                          {fav.business?.category && (
                            <span className="badge badge-confirmed" style={{ fontSize: '0.72rem' }}>
                              {fav.business.category}
                            </span>
                          )}
                        </div>
                        {fav.business?.address && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: '#64748b' }}>
                            <MapPin size={13} color="var(--primary-color)" />
                            <span>{fav.business.address}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: 'auto' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleFavBusinessNotifications(fav.businessId, fav.receiveNotifications)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '7px 12px',
                            borderRadius: '20px',
                            border: fav.receiveNotifications ? '1px solid #bae6fd' : '1px solid #cbd5e1',
                            background: fav.receiveNotifications ? '#f0f9ff' : '#f8fafc',
                            color: fav.receiveNotifications ? '#0284c7' : '#64748b',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                          title="Activar o silenciar avisos de este comercio"
                        >
                          {fav.receiveNotifications ? <Bell size={13} /> : <BellOff size={13} />}
                          <span>{fav.receiveNotifications ? 'Avisos activos' : 'Silenciado'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => startSmoothNavigation(navigate, `/businesses/${fav.businessId}`)}
                          style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '0.8rem' }}
                        >
                          <ExternalLink size={13} /> Ver local
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-light"
                          onClick={() => handleUnfollowBusinessFromProfile(fav.businessId)}
                          style={{ padding: '7px 10px', borderRadius: '20px', fontSize: '0.78rem', color: '#e11d48' }}
                          title="Quitar de Mis Favoritos"
                        >
                          <Heart size={13} fill="#e11d48" color="#e11d48" /> Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====== PESTAÑA: PRIVACIDAD ====== */}
          {currentTab === 'privacy' && (
            <div>
              {profileMessage && (
                <div className={profileMessage.type === 'success' ? 'alert-success' : 'alert-danger'} style={{ marginBottom: '1.25rem' }}>
                  {profileMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {profileMessage.text}
                </div>
              )}

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
                  onClick={() => {
                    localStorage.setItem('turnos_ya_privacy_prefs', JSON.stringify(privacy));
                    setProfileMessage({
                      type: 'success',
                      text: 'Tus preferencias de privacidad han sido guardadas.',
                    });
                  }}
                  style={{ padding: '0.75rem 1.75rem' }}
                >
                  <Save size={16} /> Guardar preferencias
                </button>
              </div>

              <div className="divider" style={{ margin: '2rem 0 1.5rem' }} />

              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-title)' }}>
                Políticas Legales y Consentimiento
              </h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Consultá nuestras directivas de protección de datos o administrá las cookies que guardamos en tu navegador.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.15rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-title)' }}>Términos y Condiciones Generales</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Condiciones de uso, reservas, asistencias y cancelaciones.</p>
                  </div>
                  <button type="button" className="btn btn-sm btn-light" onClick={() => openLegalModal('terms')}>
                    Consultar
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.15rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-title)' }}>Cómo cuidamos tu privacidad (Ley 25.326)</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Tratamiento seguro de datos personales y derechos ARCO.</p>
                  </div>
                  <button type="button" className="btn btn-sm btn-light" onClick={() => openLegalModal('privacy')}>
                    Consultar
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.15rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-title)' }}>Preferencias de Cookies</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Controlá cookies de análisis y personalización en este dispositivo.</p>
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openLegalModal('cookies')}>
                    Configurar
                  </button>
                </div>
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
      <div className="profile-hub-wrapper" key="profile-hub-main">
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
            onClick={() => navigateProfileTab('profile')}
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
          onClick={() => navigateProfileTab('profile')}
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
          onClick={() => navigateProfileTab('security')}
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
          onClick={() => startSmoothNavigation(navigate, '/my-appointments')}
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

        {/* 3.5. Mis Comercios Favoritos */}
        <div
          className="profile-hub-card"
          onClick={() => navigateProfileTab('favorites')}
          role="button"
          tabIndex={0}
        >
          <div className="profile-hub-card-top">
            <div className="profile-hub-card-icon" style={{ color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2' }}>
              <Heart size={24} strokeWidth={1.8} />
            </div>
            {favoriteBusinesses.length > 0 && (
              <span
                style={{
                  background: '#ffe4e6',
                  color: '#be123c',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                {favoriteBusinesses.length} {favoriteBusinesses.length === 1 ? 'seguido' : 'seguidos'}
              </span>
            )}
          </div>
          <div>
            <h3 className="profile-hub-card-title">Mis Favoritos</h3>
            <p className="profile-hub-card-desc">Comercios que seguís, alertas de promos y avisos de feriados.</p>
          </div>
        </div>

        {/* 4. Comunicaciones */}
        <div
          className="profile-hub-card"
          onClick={() => navigateProfileTab('notifications')}
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
          onClick={() => navigateProfileTab('privacy')}
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
          onClick={() => startSmoothNavigation(navigate, '/dashboard')}
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

        {/* 7. Centro de Administración (Solo Administradores) */}
        {(profileForm.role === 'administrator' || user?.role === 'administrator') && (
          <div
            className="profile-hub-card"
            onClick={() => startSmoothNavigation(navigate, '/system')}
            role="button"
            tabIndex={0}
          >
            <div className="profile-hub-card-top">
              <div className="profile-hub-card-icon" style={{ color: '#0284c7', borderColor: '#bae6fd', background: '#e0f2fe' }}>
                <ShieldCheck size={24} strokeWidth={1.8} />
              </div>
              <span
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '10px',
                }}
              >
                ADMIN
              </span>
            </div>
            <div>
              <h3 className="profile-hub-card-title">Centro de Administración</h3>
              <p className="profile-hub-card-desc">Auditoría de comercios, radar de calidad, usuarios y soporte.</p>
            </div>
          </div>
        )}
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
            style={{ maxWidth: '500px', width: '100%' }}
          >
            <div className="modal-drag-handle" />
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
                    {passwordModalStep === 'no_methods' && 'Paso previo: Verificación de identidad requerida'}
                    {passwordModalStep === 'choose_method' && 'Paso 1 de 2: Elegir método de verificación'}
                    {passwordModalStep === 'verify_email' && 'Paso 1 de 2: Verificación de código por mail'}
                    {passwordModalStep === 'verify_2fa' && 'Paso 1 de 2: Verificación con Google Authenticator'}
                    {passwordModalStep === 'set_passwords' && 'Paso 2 de 2: Establecer nueva contraseña'}
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

            {passwordModalStep === 'no_methods' ? (
              <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  border: '1px solid #fecaca',
                }}>
                  <ShieldAlert size={28} />
                </div>
                <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-title)' }}>
                  Verificación de identidad requerida
                </h4>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                  Para proteger tu cuenta, requerimos verificar tu identidad antes de cambiar la contraseña. Actualmente no tienes ningún método de verificación configurado.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <button
                    type="button"
                    onClick={handleStartEmailFromModal}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    className="btn-outline-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Verificar correo electrónico</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{profileForm.email || 'Ingresá a tu perfil para verificar'}</div>
                      </div>
                    </div>
                    <ArrowRight size={16} color="#94a3b8" />
                  </button>

                  <button
                    type="button"
                    onClick={handleStart2FAFromModal}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    className="btn-outline-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Smartphone size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Activar Google Authenticator (2FA)</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Códigos dinámicos de máxima seguridad</div>
                      </div>
                    </div>
                    <ArrowRight size={16} color="#94a3b8" />
                  </button>
                </div>

                <div className="modal-footer-responsive" style={{ justifyContent: 'center' }}>
                  <button type="button" className="btn btn-light" onClick={handleClosePasswordModal}>
                    Entendido, cancelar
                  </button>
                </div>
              </div>
            ) : passwordModalStep === 'choose_method' ? (
              <div style={{ padding: '0.5rem 0' }}>
                <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                  Tienes dos métodos de verificación activos. Selecciona cuál prefieres utilizar para confirmar tu identidad:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={handleChooseEmailMethod}
                    disabled={securityLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid #bae6fd',
                      background: '#f0f9ff',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0369a1' }}>Código por correo electrónico</div>
                        <div style={{ fontSize: '0.8rem', color: '#0284c7' }}>Recibirás un código de 6 dígitos en {profileForm.email}</div>
                      </div>
                    </div>
                    <ArrowRight size={18} color="#0284c7" />
                  </button>

                  <button
                    type="button"
                    onClick={handleChoose2FAMethod}
                    disabled={securityLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid #bbf7d0',
                      background: '#f0fdf4',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#15803d' }}>Google Authenticator (2FA)</div>
                        <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>Ingresa el código dinámico de tu app</div>
                      </div>
                    </div>
                    <ArrowRight size={18} color="#16a34a" />
                  </button>
                </div>

                <div className="modal-footer-responsive">
                  <button type="button" className="btn btn-light" onClick={handleClosePasswordModal}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : passwordModalStep === 'verify_2fa' ? (
              <form onSubmit={handleVerifyPassword2FACode}>
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
                  <Smartphone size={18} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#166534', lineHeight: 1.45 }}>
                    Abre tu aplicación <strong>Google Authenticator</strong> e ingresa el código numérico de 6 dígitos (o uno de tus códigos de respaldo) para validar tu identidad.
                  </p>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                  <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                    Código de Google Authenticator
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    className="form-control"
                    placeholder="123456"
                    value={twoFactorPasswordCode}
                    onChange={(e) => setTwoFactorPasswordCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
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
                    El código se renueva cada 30 segundos en tu dispositivo móvil.
                  </small>
                </div>

                <div className="modal-footer-responsive">
                  {profileForm.emailVerified && profileForm.twoFactorEnabled && (
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => setPasswordModalStep('choose_method')}
                      style={{ marginRight: 'auto' }}
                    >
                      <ArrowLeft size={14} /> Cambiar método
                    </button>
                  )}
                  <button type="button" className="btn btn-light" onClick={handleClosePasswordModal}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={securityLoading || twoFactorPasswordCode.trim().length < 6}
                  >
                    <CheckCircle2 size={16} /> {securityLoading ? 'Verificando...' : 'Verificar 2FA'}
                  </button>
                </div>
              </form>
            ) : passwordModalStep === 'verify_email' ? (
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

                <div className="modal-footer-responsive">
                  {profileForm.emailVerified && profileForm.twoFactorEnabled && (
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => setPasswordModalStep('choose_method')}
                      style={{ marginRight: 'auto' }}
                    >
                      <ArrowLeft size={14} /> Cambiar método
                    </button>
                  )}
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

                <div className="modal-footer-responsive">
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
            style={{ maxWidth: '440px', width: '100%' }}
          >
            <div className="modal-drag-handle" />
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

            <div className="modal-footer-responsive" style={{ justifyContent: 'space-between' }}>
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
            style={{ maxWidth: '440px', width: '100%' }}
          >
            <div className="modal-drag-handle" />
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
                placeholder="+54 9 11 1234-5678"
                onChange={(e) => setPhoneInputValue(e.target.value)}
              />
            </div>

            <div className="modal-footer-responsive">
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

      {/* Modal Real para Google Authenticator (2FA) */}
      {isTwoFactorModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTwoFactorModalOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', width: '100%' }}
          >
            <div className="modal-drag-handle" />
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

                    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 12px', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Info size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.8rem', color: '#0369a1', lineHeight: 1.4 }}>
                        <strong>Recomendación importante:</strong> Si tenías una cuenta guardada de Turnos Ya de un intento anterior en tu app Authenticator, <strong>eliminala primero</strong> antes de escanear este código para asegurarte de que el código que leas corresponda a esta clave.
                      </div>
                    </div>

                    {twoFactorQr && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '10px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                          <img src={twoFactorQr} alt="Código QR 2FA" style={{ width: '160px', height: '160px', display: 'block' }} />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenTwoFactorModal(true)}
                          disabled={twoFactorLoading}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0284c7',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '8px',
                            textDecoration: 'underline'
                          }}
                        >
                          <RefreshCw size={12} className={twoFactorLoading ? 'spin' : ''} />
                          ¿Problemas al escanear? Generar una nueva clave QR
                        </button>
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
                        onChange={(e) => setTwoFactorCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && twoFactorCodeInput.length === 6 && !twoFactorLoading) {
                            handleVerifyAndEnableTwoFactor();
                          }
                        }}
                        style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '4px', fontWeight: 700 }}
                        autoFocus
                      />
                    </div>

                    <div className="modal-footer-responsive">
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

                <div className="modal-footer-responsive" style={{ justifyContent: 'space-between' }}>
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

                <div className="modal-footer-responsive">
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
            style={{ maxWidth: '480px', width: '100%' }}
          >
            <div className="modal-drag-handle" />
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

            <div className="modal-footer-responsive">
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
                onClick={async () => {
                  try {
                    await api.delete('/auth/account');
                  } catch {
                    // Proceed with logout even if request fails
                  }
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
