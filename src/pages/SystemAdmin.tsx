import React, { useEffect, useState } from 'react';
import api, { clientCache } from '../services/api';
import {
  Users,
  Building2,
  Calendar,
  ShieldCheck,
  Trash2,
  Bug,
  X,
  CheckCircle2,
  Eye,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Check,
  Zap,
  Clock,
  Phone,
  MapPin,
  Globe,
  MessageCircle,
  Mail,
  Copy,
  FileText,
  CheckCheck,
  AlertCircle,
  Tags,
  Megaphone,
  History,
  Plus,
  Edit2,
  Info,
  EyeOff,
  Flag
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { startSmoothNavigation } from '../utils/transitionNavigator';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTimeToHHMM } from '../utils/timeHelper';
import { SkeletonTable } from '../components/common/SkeletonLoaders';
import { Pagination } from '../components/common/Pagination';
import { type Business, type Appointment } from '../types';
import { getAdminBugReportsApi, updateBugReportStatusApi } from '../services/bugReportService';

const ROLE_LABELS: Record<string, { label: string; badge: string }> = {
  client: { label: 'Cliente', badge: 'badge-completed' },
  owner: { label: 'Dueño', badge: 'badge-confirmed' },
  administrator: { label: 'Administrador', badge: 'badge-pending' },
};


const InstagramIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const FacebookIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

export const SystemAdmin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Navegación principal de pestañas
  const [activeTab, setActiveTab] = useState<
    'cockpit' | 'users' | 'businesses' | 'appointments' | 'reports' | 'categories' | 'announcements' | 'audit'
  >('cockpit');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const statusParam = searchParams.get('status');
    if (
      tabParam &&
      ['cockpit', 'users', 'businesses', 'appointments', 'reports', 'categories', 'announcements', 'audit'].includes(tabParam)
    ) {
      setActiveTab(tabParam as any);
    }
    if (tabParam === 'businesses' && statusParam && ['ALL', 'pending_approval', 'approved', 'rejected', 'suspended'].includes(statusParam)) {
      setBizStatusFilter(statusParam as any);
    }
    if (tabParam === 'reports' && statusParam && ['ALL', 'PENDING', 'IN_REVIEW', 'RESOLVED', 'DISCARDED'].includes(statusParam)) {
      setReportsStatusFilter(statusParam);
    }
  }, [searchParams]);

  // Estadísticas avanzadas del Centro de Control Ejecutivo
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalBusinesses: number;
    totalAppointments: number;
    totalAdmins: number;
    totalOwners?: number;
    totalClients?: number;
    todayAppointments?: number;
    pendingBugReports?: number;
    appointmentsByStatus?: Record<string, number>;
    recentAppointments?: any[];
    recentUsers?: any[];
  }>({
    totalUsers: 0,
    totalBusinesses: 0,
    totalAppointments: 0,
    totalAdmins: 0,
    totalOwners: 0,
    totalClients: 0,
    todayAppointments: 0,
    pendingBugReports: 0,
    appointmentsByStatus: { CONFIRMED: 0, PENDING: 0, COMPLETED: 0, CANCELLED: 0 },
    recentAppointments: [],
    recentUsers: [],
  });

  // Datos principales
  const [users, setUsers] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bizStatusFilter, setBizStatusFilter] = useState<'ALL' | 'pending_approval' | 'approved' | 'rejected' | 'suspended'>('ALL');
  const [businessToApprove, setBusinessToApprove] = useState<any | null>(null);
  const [businessToReject, setBusinessToReject] = useState<any | null>(null);
  const [businessToSuspend, setBusinessToSuspend] = useState<any | null>(null);
  const [suspendReasonInput, setSuspendReasonInput] = useState('');
  const [businessToReactivate, setBusinessToReactivate] = useState<any | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [businessToDelete, setBusinessToDelete] = useState<any | null>(null);
  const [deleteBizReasonInput, setDeleteBizReasonInput] = useState('');
  const [deleteBizAlsoOwner, setDeleteBizAlsoOwner] = useState(false);
  const [processingBizAction, setProcessingBizAction] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Bug reports
  const [reports, setReports] = useState<any[]>([]);
  const [reportsCounts, setReportsCounts] = useState({ pending: 0, inReview: 0, resolved: 0, discarded: 0, total: 0 });
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsStatusFilter, setReportsStatusFilter] = useState<string>('ALL');
  const [reportsTypeFilter, setReportsTypeFilter] = useState<'ALL' | 'SOLICITUD_RUBRO' | 'MODERACION_RESENA' | 'BUG'>('ALL');
  const [adminAptCancelReason, setAdminAptCancelReason] = useState('');
  const [cancellingAptId, setCancellingAptId] = useState<number | null>(null);

  // Gestión de Categorías y Rubros (Módulo 2)
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState<{
    name: string;
    slug: string;
    description: string;
    icon: string;
    isActive: boolean;
  }>({
    name: '',
    slug: '',
    description: '',
    icon: '🏢',
    isActive: true,
  });
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  // Avisos del Sistema y Banners Globales (Módulo 3)
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState<{
    message: string;
    type: 'info' | 'warning' | 'danger' | 'success';
    linkUrl: string;
    linkText: string;
    expiresAt: string;
  }>({
    message: '',
    type: 'info',
    linkUrl: '',
    linkText: '',
    expiresAt: '',
  });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<any | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState(false);

  // Registro de Auditoría del Sistema (Módulo 4)
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  // Cancelación de Emergencia por Fuerza Mayor (Módulo 4)
  const [emergencyCancelBiz, setEmergencyCancelBiz] = useState<any | null>(null);
  const [emergencyCancelDate, setEmergencyCancelDate] = useState(new Date().toISOString().split('T')[0]);
  const [emergencyCancelReason, setEmergencyCancelReason] = useState('');
  const [processingEmergencyCancel, setProcessingEmergencyCancel] = useState(false);
  const [emergencyCancelResult, setEmergencyCancelResult] = useState<{ cancelledCount: number; message: string } | null>(null);

  // Estados de carga y feedback
  const [loadingTab, setLoadingTab] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Filtros de Usuarios
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'client' | 'owner' | 'administrator'>('ALL');
  const [usersPage, setUsersPage] = useState(1);

  // Filtros de Comercios
  const [bizSearch, setBizSearch] = useState('');
  const [bizCategoryFilter, setBizCategoryFilter] = useState('ALL');
  const [bizPage, setBizPage] = useState(1);

  // Filtros de Turnos
  const [aptSearch, setAptSearch] = useState('');
  const [aptStatusFilter, setAptStatusFilter] = useState<string>('ALL');
  const [aptDateFilter, setAptDateFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'PAST'>('ALL');
  const [aptPage, setAptPage] = useState(1);

  const PER_PAGE = 8;

  // Modales de Inspección Rápida
  const [inspectedUser, setInspectedUser] = useState<any | null>(null);
  const [inspectedBusiness, setInspectedBusiness] = useState<any | null>(null);
  const [copiedCuit, setCopiedCuit] = useState(false);

  const handleCopyCuit = (cuit: string) => {
    if (!cuit) return;
    navigator.clipboard.writeText(cuit);
    setCopiedCuit(true);
    setTimeout(() => setCopiedCuit(false), 2000);
  };
  const [inspectedAppointment, setInspectedAppointment] = useState<any | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [savingReportId, setSavingReportId] = useState<number | null>(null);

  // Modal de confirmación para eliminar usuario
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);

  // Estados de Caché Inteligente
  const [cacheStats, setCacheStats] = useState<{ hits: number; misses: number; totalKeys: number; hitRatio: string; engine: string } | null>(null);
  const [clearingCache, setClearingCache] = useState(false);
  const [showCacheModal, setShowCacheModal] = useState(false);

  const loadCacheStats = async () => {
    try {
      const res = await api.get('/admin/cache/stats');
      setCacheStats(res.data);
    } catch {
      // Endpoint admin only
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await api.post('/admin/cache/clear');
      clientCache.clear();
      showToast('Caché purgada exitosamente en servidor y cliente');
      await Promise.all([loadStatsAndReports(), loadCacheStats(), fetchTabData()]);
    } catch {
      showToast('Error al purgar la caché');
    } finally {
      setClearingCache(false);
    }
  };

  // Seguridad: Verificación de acceso
  useEffect(() => {
    if (user?.role !== 'administrator') {
      navigate('/');
    }
  }, [user, navigate]);

  // Cargar estadísticas y reportes iniciales
  const loadStatsAndReports = async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        api.get('/admin/stats'),
        getAdminBugReportsApi({ page: 1, limit: 1 }),
      ]);
      setStats(statsRes.data);
      if (reportsRes.counts) {
        setReportsCounts(reportsRes.counts);
      }
      loadCacheStats();
    } catch (err) {
      console.error('Error al cargar estadísticas del administrador', err);
    }
  };

  useEffect(() => {
    loadStatsAndReports();
  }, []);

  // Carga de datos según la pestaña activa
  const fetchTabData = async () => {
    setLoadingTab(true);
    try {
      if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data.data ?? []);
      }
      if (activeTab === 'businesses') {
        const res = await api.get('/admin/businesses?status=ALL&limit=250');
        setBusinesses(res.data.data ?? []);
      }
      if (activeTab === 'appointments') {
        const res = await api.get('/admin/appointments');
        setAppointments(res.data.data ?? []);
      }
      if (activeTab === 'reports') {
        const res = await getAdminBugReportsApi({
          page: reportsPage,
          limit: PER_PAGE,
          status: reportsStatusFilter === 'ALL' ? undefined : reportsStatusFilter,
        });
        setReports(res.data ?? []);
        setReportsTotalPages(res.meta?.totalPages || 1);
        if (res.counts) setReportsCounts(res.counts);
      }
      if (activeTab === 'categories') {
        const res = await api.get('/admin/categories');
        setCategories(res.data.data ?? []);
      }
      if (activeTab === 'announcements') {
        const res = await api.get('/admin/announcements');
        setAnnouncements(res.data.data ?? []);
      }
      if (activeTab === 'audit') {
        const params: any = { page: auditPage, limit: 20 };
        if (auditActionFilter !== 'ALL') params.action = auditActionFilter;
        if (auditSearch.trim()) params.search = auditSearch.trim();
        const res = await api.get('/admin/audit-logs', { params });
        setAuditLogs(res.data.data ?? []);
        setAuditTotal(res.data.meta?.total || 0);
        setAuditTotalPages(res.data.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error('Error al cargar datos de pestaña', err);
    } finally {
      setLoadingTab(false);
    }
  };

  useEffect(() => {
    fetchTabData();
  }, [
    activeTab,
    reportsPage,
    reportsStatusFilter,
    auditPage,
    auditActionFilter
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStatsAndReports(), fetchTabData()]);
    setRefreshing(false);
    showToast('✓ Datos del sistema actualizados');
  };

  // Acciones de Aprobación y Rechazo de Comercio
  const handleApproveBusiness = async () => {
    if (!businessToApprove) return;
    setProcessingBizAction(true);
    try {
      await api.patch(`/admin/businesses/${businessToApprove.id}/approve`);
      showToast(`¡Comercio "${businessToApprove.name}" aprobado y dado de alta exitosamente!`);
      // Actualización optimista inmediata en la UI
      setBusinesses((prev) =>
        prev.map((b) => (b.id === businessToApprove.id ? { ...b, status: 'approved', rejectionReason: null } : b))
      );
      setBusinessToApprove(null);
      await Promise.all([fetchTabData(), loadStatsAndReports()]);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al aprobar comercio');
    } finally {
      setProcessingBizAction(false);
    }
  };

  const handleRejectBusiness = async () => {
    if (!businessToReject || !rejectionReasonInput.trim()) return;
    setProcessingBizAction(true);
    try {
      await api.patch(`/admin/businesses/${businessToReject.id}/reject`, {
        reason: rejectionReasonInput.trim()
      });
      showToast(`Comercio "${businessToReject.name}" observado y notificado al dueño.`);
      // Actualización optimista inmediata en la UI
      setBusinesses((prev) =>
        prev.map((b) => (b.id === businessToReject.id ? { ...b, status: 'rejected', rejectionReason: rejectionReasonInput.trim() } : b))
      );
      setBusinessToReject(null);
      setRejectionReasonInput('');
      await Promise.all([fetchTabData(), loadStatsAndReports()]);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al rechazar comercio');
    } finally {
      setProcessingBizAction(false);
    }
  };

  const handleSuspendBusiness = async () => {
    if (!businessToSuspend || suspendReasonInput.trim().length < 5) return;
    setProcessingBizAction(true);
    try {
      await api.patch(`/admin/businesses/${businessToSuspend.id}/suspend`, {
        reason: suspendReasonInput.trim()
      });
      showToast(`Comercio "${businessToSuspend.name}" suspendido temporalmente.`);
      setBusinesses((prev) =>
        prev.map((b) => (b.id === businessToSuspend.id ? { ...b, status: 'suspended', rejectionReason: suspendReasonInput.trim() } : b))
      );
      setBusinessToSuspend(null);
      setSuspendReasonInput('');
      await Promise.all([fetchTabData(), loadStatsAndReports()]);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al suspender comercio');
    } finally {
      setProcessingBizAction(false);
    }
  };

  const handleReactivateBusiness = async () => {
    if (!businessToReactivate) return;
    setProcessingBizAction(true);
    try {
      await api.patch(`/admin/businesses/${businessToReactivate.id}/reactivate`);
      showToast(`¡Comercio "${businessToReactivate.name}" reactivado exitosamente!`);
      setBusinesses((prev) =>
        prev.map((b) => (b.id === businessToReactivate.id ? { ...b, status: 'approved', rejectionReason: null } : b))
      );
      setBusinessToReactivate(null);
      await Promise.all([fetchTabData(), loadStatsAndReports()]);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al reactivar comercio');
    } finally {
      setProcessingBizAction(false);
    }
  };

  const handleDeleteBusinessByAdmin = async () => {
    if (!businessToDelete || deleteBizReasonInput.trim().length < 5) return;
    setProcessingBizAction(true);
    try {
      const res = await api.delete(`/admin/businesses/${businessToDelete.id}`, {
        data: {
          reason: deleteBizReasonInput.trim(),
          deleteOwner: deleteBizAlsoOwner
        }
      });
      showToast(res.data?.message || `✓ Comercio "${businessToDelete.name}" eliminado definitivamente y registrado en Auditoría.`);
      setBusinesses((prev) => prev.filter((b) => b.id !== businessToDelete.id));
      if (res.data?.deletedOwnerId) {
        setUsers((prev) => prev.filter((u) => u.id !== res.data.deletedOwnerId));
      }
      setBusinessToDelete(null);
      setDeleteBizReasonInput('');
      setDeleteBizAlsoOwner(false);
      await Promise.all([fetchTabData(), loadStatsAndReports()]);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al eliminar el comercio');
    } finally {
      setProcessingBizAction(false);
    }
  };

  // Manejadores de Categorías (Módulo 2)
  const handleOpenCategoryModal = (cat?: any) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        icon: cat.icon || '🏢',
        isActive: cat.isActive !== false,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
        icon: '🏢',
        isActive: true,
      });
    }
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim() || categoryForm.name.trim().length < 2) {
      showToast('El nombre de la categoría debe tener al menos 2 caracteres');
      return;
    }
    setSavingCategory(true);
    try {
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory.id}`, categoryForm);
        showToast(`✓ Categoría "${categoryForm.name}" actualizada con éxito`);
      } else {
        await api.post('/admin/categories', categoryForm);
        showToast(`✓ Categoría "${categoryForm.name}" creada con éxito`);
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      await fetchTabData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al guardar categoría');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleToggleCategory = async (cat: any) => {
    try {
      const res = await api.patch(`/admin/categories/${cat.id}/toggle`);
      const updated = res.data;
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, isActive: updated.isActive } : c)));
      showToast(`✓ Categoría ${updated.isActive ? 'activada' : 'desactivada'} correctamente`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al cambiar estado de categoría');
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setDeletingCategory(true);
    try {
      await api.delete(`/admin/categories/${categoryToDelete.id}`);
      showToast(`✓ Categoría "${categoryToDelete.name}" eliminada exitosamente`);
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      setCategoryToDelete(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al eliminar categoría');
    } finally {
      setDeletingCategory(false);
    }
  };

  // Manejadores de Avisos del Sistema (Módulo 3)
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.message.trim() || announcementForm.message.trim().length < 5) {
      showToast('El comunicado debe contener al menos 5 caracteres');
      return;
    }
    setSavingAnnouncement(true);
    try {
      await api.post('/admin/announcements', {
        message: announcementForm.message.trim(),
        type: announcementForm.type,
        linkUrl: announcementForm.linkUrl.trim() || undefined,
        linkText: announcementForm.linkText.trim() || undefined,
        expiresAt: announcementForm.expiresAt || undefined,
      });
      showToast('✓ Comunicado publicado en el banner global');
      setAnnouncementModalOpen(false);
      setAnnouncementForm({
        message: '',
        type: 'info',
        linkUrl: '',
        linkText: '',
        expiresAt: '',
      });
      await fetchTabData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al publicar comunicado');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleToggleAnnouncement = async (ann: any) => {
    try {
      const res = await api.patch(`/admin/announcements/${ann.id}/toggle`);
      const updated = res.data;
      setAnnouncements((prev) => prev.map((a) => (a.id === ann.id ? { ...a, isActive: updated.isActive } : a)));
      showToast(`✓ Aviso ${updated.isActive ? 'activado' : 'pausado'} correctamente`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al alternar aviso');
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    setDeletingAnnouncement(true);
    try {
      await api.delete(`/admin/announcements/${announcementToDelete.id}`);
      showToast('✓ Aviso eliminado exitosamente');
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementToDelete.id));
      setAnnouncementToDelete(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al eliminar aviso');
    } finally {
      setDeletingAnnouncement(false);
    }
  };

  // Manejador de Cancelación de Emergencia por Fuerza Mayor (Módulo 4)
  const handleEmergencyCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyCancelBiz || !emergencyCancelDate || !emergencyCancelReason.trim()) {
      showToast('Debe ingresar la fecha y el motivo de fuerza mayor');
      return;
    }
    if (emergencyCancelReason.trim().length < 5) {
      showToast('El motivo debe tener al menos 5 caracteres descriptivos');
      return;
    }
    setProcessingEmergencyCancel(true);
    try {
      const res = await api.post(`/admin/businesses/${emergencyCancelBiz.id}/emergency-cancel`, {
        date: emergencyCancelDate,
        reason: emergencyCancelReason.trim(),
      });
      setEmergencyCancelResult({
        cancelledCount: res.data.cancelledCount ?? 0,
        message: res.data.message || 'Cancelación de emergencia ejecutada exitosamente',
      });
      showToast(`✓ Se cancelaron ${res.data.cancelledCount ?? 0} turnos por fuerza mayor`);
      setEmergencyCancelBiz(null);
      setEmergencyCancelReason('');
      await Promise.all([loadStatsAndReports(), fetchTabData()]);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al procesar cancelación de emergencia');
    } finally {
      setProcessingEmergencyCancel(false);
    }
  };

  // Manejadores de Usuarios
  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      if (inspectedUser && inspectedUser.id === userId) {
        setInspectedUser((prev: any) => ({ ...prev, role: newRole }));
      }
      showToast(`✓ Rol actualizado a ${ROLE_LABELS[newRole]?.label}`);
      loadStatsAndReports();
    } catch {
      showToast('Error al cambiar rol del usuario');
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      if (inspectedUser && inspectedUser.id === userToDelete.id) {
        setInspectedUser(null);
      }
      showToast(`✓ Usuario "${userToDelete.name}" eliminado`);
      setUserToDelete(null);
      loadStatsAndReports();
    } catch {
      showToast('Error al eliminar usuario');
    }
  };

  // Manejadores de Reportes de Errores
  const handleReportStatusChange = async (reportId: number, newStatus: string, notes?: string) => {
    setSavingReportId(reportId);
    try {
      await updateBugReportStatusApi(reportId, newStatus, notes);
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: newStatus, adminNotes: notes !== undefined ? notes : r.adminNotes } : r
        )
      );
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport((prev: any) => ({
          ...prev,
          status: newStatus,
          adminNotes: notes !== undefined ? notes : prev.adminNotes,
        }));
      }
      showToast('✓ Estado del reporte actualizado');
      const res = await getAdminBugReportsApi({ page: 1, limit: 1 });
      if (res.counts) setReportsCounts(res.counts);
    } catch {
      showToast('Error al actualizar reporte');
    } finally {
      setSavingReportId(null);
    }
  };

  // Filtrado reactivo de Usuarios
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });
  const totalUsersPages = Math.ceil(filteredUsers.length / PER_PAGE) || 1;
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * PER_PAGE, usersPage * PER_PAGE);

  // Categorías únicas de Comercios para filtro
  const categoriesList = Array.from(
    new Set(businesses.map((b) => b.category || (b as any).categoryRel?.name).filter(Boolean))
  ) as string[];

  // Contadores de estado de comercios
  const pendingBizCount = businesses.filter((b) => b.status === 'pending_approval').length;
  const effectivePendingBizCount = businesses.length > 0 ? pendingBizCount : ((stats as any).pendingBusinesses ?? 0);
  const approvedBizCount = businesses.filter((b) => (b.status || 'approved') === 'approved').length;
  const rejectedBizCount = businesses.filter((b) => b.status === 'rejected').length;
  const suspendedBizCount = businesses.filter((b) => (b.status as any) === 'suspended').length;

  // Filtrado reactivo de Comercios
  const filteredBusinesses = businesses.filter((b) => {
    const cat = b.category || (b as any).categoryRel?.name || '';
    const bStatus = b.status || 'approved';
    const matchesSearch =
      (b.name || '').toLowerCase().includes(bizSearch.toLowerCase()) ||
      (b.address || '').toLowerCase().includes(bizSearch.toLowerCase()) ||
      (b.owner?.name || '').toLowerCase().includes(bizSearch.toLowerCase()) ||
      (b.owner?.email || '').toLowerCase().includes(bizSearch.toLowerCase());
    const matchesCategory = bizCategoryFilter === 'ALL' || cat === bizCategoryFilter;
    const matchesStatus = bizStatusFilter === 'ALL' || bStatus === bizStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  const totalBizPages = Math.ceil(filteredBusinesses.length / PER_PAGE) || 1;
  const paginatedBusinesses = filteredBusinesses.slice((bizPage - 1) * PER_PAGE, bizPage * PER_PAGE);

  // Filtrado reactivo de Turnos
  const todayDateStr = new Date().toISOString().split('T')[0];
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      (apt.user?.name || '').toLowerCase().includes(aptSearch.toLowerCase()) ||
      (apt.user?.email || '').toLowerCase().includes(aptSearch.toLowerCase()) ||
      (apt.business?.name || '').toLowerCase().includes(aptSearch.toLowerCase()) ||
      (apt.service?.name || '').toLowerCase().includes(aptSearch.toLowerCase()) ||
      `#${apt.id}`.includes(aptSearch);

    const matchesStatus = aptStatusFilter === 'ALL' || apt.status === aptStatusFilter;

    let matchesDate = true;
    const aptDateOnly = typeof apt.date === 'string' ? apt.date.split('T')[0] : '';
    if (aptDateFilter === 'TODAY') {
      matchesDate = aptDateOnly === todayDateStr;
    } else if (aptDateFilter === 'UPCOMING') {
      matchesDate = aptDateOnly >= todayDateStr;
    } else if (aptDateFilter === 'PAST') {
      matchesDate = aptDateOnly < todayDateStr;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });
  const totalAptPages = Math.ceil(filteredAppointments.length / PER_PAGE) || 1;
  const paginatedAppointments = filteredAppointments.slice((aptPage - 1) * PER_PAGE, aptPage * PER_PAGE);

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1rem 0.5rem 3rem' }}>
      {/* Toast flotante */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '5.5rem',
            right: '1.5rem',
            zIndex: 2100,
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.88rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Sparkles size={16} color="#38bdf8" /> {toast}
        </div>
      )}

      {/* Cabecera Ejecutiva */}
      <div className="admin-cockpit-header">
        <div className="admin-cockpit-title-wrap">
          <div className="admin-cockpit-icon-badge">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-title)' }}>
                Centro de Administración
              </h1>
              <span
                style={{
                  background: '#e0f2fe',
                  color: '#0284c7',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                PRO
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.86rem', color: '#64748b' }}>
              Monitoreo ejecutivo en tiempo real, control de usuarios, comercios y turnos de la plataforma.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-light"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ fontSize: '0.84rem', padding: '8px 14px' }}
            title="Refrescar datos del sistema"
          >
            <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
            <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => startSmoothNavigation(navigate, '/', { direction: 'backward' })}
            style={{ fontSize: '0.84rem', padding: '8px 16px' }}
          >
            ← Volver al sitio
          </button>
        </div>
      </div>

      {/* Segmented Navigation Tabs (5 Pestañas Maestras sin desborde horizontal) */}
      <nav className="admin-cockpit-nav" aria-label="Navegación del panel de administración">
        <button
          type="button"
          className={`admin-nav-item ${activeTab === 'cockpit' ? 'active' : ''}`}
          onClick={() => setActiveTab('cockpit')}
        >
          <Sparkles size={16} />
          <span>Centro de Control</span>
        </button>

        <button
          type="button"
          className={`admin-nav-item ${activeTab === 'businesses' || activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('businesses')}
        >
          <Building2 size={16} />
          <span>Comercios y Rubros</span>
          <span className={`admin-nav-badge ${effectivePendingBizCount > 0 ? 'danger' : ''}`}>
            {effectivePendingBizCount > 0 ? `${effectivePendingBizCount} pend.` : stats.totalBusinesses}
          </span>
        </button>

        <button
          type="button"
          className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          <span>Usuarios</span>
          <span className="admin-nav-badge">{stats.totalUsers}</span>
        </button>

        <button
          type="button"
          className={`admin-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar size={16} />
          <span>Turnos Globales</span>
          <span className="admin-nav-badge">{stats.totalAppointments}</span>
        </button>

        <button
          type="button"
          className={`admin-nav-item ${activeTab === 'reports' || activeTab === 'announcements' || activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <Bug size={16} />
          <span>Soporte y Sistema</span>
          <span className={`admin-nav-badge ${reportsCounts.pending > 0 ? 'danger' : ''}`}>
            {reportsCounts.pending > 0 ? reportsCounts.pending : reportsCounts.total}
          </span>
        </button>
      </nav>

      {/* Sub-navegación contextual: Comercios y Rubros */}
      {(activeTab === 'businesses' || activeTab === 'categories') && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '1rem',
            padding: '6px',
            background: '#f1f5f9',
            borderRadius: '12px',
            width: 'fit-content',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('businesses')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'businesses' ? '#ffffff' : 'transparent',
              color: activeTab === 'businesses' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'businesses' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Building2 size={15} />
            <span>Directorio de Comercios ({stats.totalBusinesses})</span>
            {effectivePendingBizCount > 0 && (
              <span style={{ background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '10px', fontSize: '0.72rem' }}>
                {effectivePendingBizCount} por aprobar
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'categories' ? '#ffffff' : 'transparent',
              color: activeTab === 'categories' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'categories' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Tags size={15} />
            <span>Rubros y Categorías ({categories.length || categoriesList.length})</span>
          </button>
        </div>
      )}

      {/* Sub-navegación contextual: Soporte y Sistema */}
      {(activeTab === 'reports' || activeTab === 'announcements' || activeTab === 'audit') && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '1rem',
            padding: '6px',
            background: '#f1f5f9',
            borderRadius: '12px',
            width: 'fit-content',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'reports' ? '#ffffff' : 'transparent',
              color: activeTab === 'reports' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'reports' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Bug size={15} />
            <span>Tickets y Solicitudes ({reportsCounts.total})</span>
            {reportsCounts.pending > 0 && (
              <span style={{ background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: '10px', fontSize: '0.72rem' }}>
                {reportsCounts.pending} pend.
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'announcements' ? '#ffffff' : 'transparent',
              color: activeTab === 'announcements' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'announcements' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Megaphone size={15} />
            <span>Avisos y Banners ({announcements.filter((a) => a.isActive).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'audit' ? '#ffffff' : 'transparent',
              color: activeTab === 'audit' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'audit' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <History size={15} />
            <span>Registro de Auditoría ({auditTotal})</span>
          </button>
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA 1: CENTRO DE CONTROL EJECUTIVO (COCKPIT) */}
      {/* ======================================================================= */}
      {activeTab === 'cockpit' && (
        <div>
          {/* Bandeja de Atención Inmediata (Action Center) */}
          {effectivePendingBizCount > 0 || reportsCounts.pending > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.25rem' }}>
              {effectivePendingBizCount > 0 && (
                <div className="admin-alert-cockpit" style={{ margin: 0, background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: '#fef3c7',
                        color: '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px', fontSize: '0.98rem', fontWeight: 800, color: '#92400e' }}>
                        Aprobación Comercial Pendiente: {effectivePendingBizCount} {effectivePendingBizCount === 1 ? 'nuevo comercio esperando revisión' : 'nuevos comercios esperando revisión'}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#b45309' }}>
                        Verificá las evidencias de veracidad y aprobá el alta para publicarlos en el catálogo.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setActiveTab('businesses');
                      setBizStatusFilter('pending_approval');
                    }}
                    style={{ fontSize: '0.84rem', padding: '8px 16px', background: '#d97706', borderColor: '#d97706' }}
                  >
                    Revisar comercios <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {reportsCounts.pending > 0 && (
                <div className="admin-alert-cockpit alert-has-pending" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Bug size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px', fontSize: '0.98rem', fontWeight: 800, color: '#991b1b' }}>
                        Atención de Soporte: {reportsCounts.pending} {reportsCounts.pending === 1 ? 'ticket pendiente' : 'tickets pendientes'}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#b91c1c' }}>
                        Solicitudes de nuevos rubros, moderación de reseñas o reportes técnicos que requieren resolución.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setActiveTab('reports');
                      setReportsStatusFilter('PENDING');
                    }}
                    style={{ fontSize: '0.84rem', padding: '8px 16px', background: '#dc2626', borderColor: '#dc2626' }}
                  >
                    Atender tickets <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="admin-alert-cockpit alert-all-good">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#dcfce7',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '0.94rem', fontWeight: 700, color: '#166534' }}>
                    Plataforma 100% Operativa y Al Día
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#15803d' }}>
                    No hay comercios ni tickets pendientes de revisión. Todos los servicios operan con normalidad.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                  Base de datos TiDB / MySQL en línea
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={() => {
                    loadCacheStats();
                    setShowCacheModal(true);
                  }}
                  style={{
                    fontSize: '0.76rem',
                    padding: '4px 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    border: '1px solid #bbf7d0',
                    background: '#ffffff',
                    color: '#0284c7',
                    fontWeight: 700,
                    borderRadius: '8px',
                  }}
                  title="Monitoreo de Caché Inteligente"
                >
                  <Zap size={12} color="#0284c7" />
                  <span>Caché: {cacheStats ? cacheStats.hitRatio : 'Activa'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 4 KPIs Ejecutivos con Micro-desglose y Acción */}
          <div className="admin-kpis-grid">
            {/* KPI 1: Usuarios */}
            <div className="admin-kpi-card-v2" onClick={() => setActiveTab('users')} role="button" tabIndex={0}>
              <div className="admin-kpi-header">
                <span className="admin-kpi-title">Usuarios Registrados</span>
                <div className="admin-kpi-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <Users size={20} />
                </div>
              </div>
              <div className="admin-kpi-value">{stats.totalUsers}</div>
              <div className="admin-kpi-footer-chips">
                <span style={{ color: '#0284c7', fontWeight: 700 }}>{stats.totalClients ?? 0}</span> clientes ·{' '}
                <span style={{ color: '#059669', fontWeight: 700 }}>{stats.totalOwners ?? 0}</span> dueños ·{' '}
                <span style={{ color: '#d97706', fontWeight: 700 }}>{stats.totalAdmins ?? 1}</span> admins
              </div>
            </div>

            {/* KPI 2: Negocios */}
            <div className="admin-kpi-card-v2" onClick={() => setActiveTab('businesses')} role="button" tabIndex={0}>
              <div className="admin-kpi-header">
                <span className="admin-kpi-title">Comercios Activos</span>
                <div className="admin-kpi-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <Building2 size={20} />
                </div>
              </div>
              <div className="admin-kpi-value">{stats.totalBusinesses}</div>
              <div className="admin-kpi-footer-chips">
                <span>{categoriesList.length} categorías comerciales activas</span>
              </div>
            </div>

            {/* KPI 3: Turnos */}
            <div className="admin-kpi-card-v2" onClick={() => setActiveTab('appointments')} role="button" tabIndex={0}>
              <div className="admin-kpi-header">
                <span className="admin-kpi-title">Turnos en la Plataforma</span>
                <div className="admin-kpi-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Calendar size={20} />
                </div>
              </div>
              <div className="admin-kpi-value">{stats.totalAppointments}</div>
              <div className="admin-kpi-footer-chips">
                <span style={{ color: '#2563eb', fontWeight: 700 }}>{stats.todayAppointments ?? 0}</span> hoy ·{' '}
                <span style={{ color: '#059669', fontWeight: 700 }}>{stats.appointmentsByStatus?.CONFIRMED ?? 0}</span> conf. ·{' '}
                <span style={{ color: '#64748b' }}>{stats.appointmentsByStatus?.COMPLETED ?? 0}</span> compl.
              </div>
            </div>

            {/* KPI 4: Soporte */}
            <div className="admin-kpi-card-v2" onClick={() => setActiveTab('reports')} role="button" tabIndex={0}>
              <div className="admin-kpi-header">
                <span className="admin-kpi-title">Atención de Reportes</span>
                <div
                  className="admin-kpi-icon-box"
                  style={{
                    background: reportsCounts.pending > 0 ? '#fee2e2' : '#f1f5f9',
                    color: reportsCounts.pending > 0 ? '#dc2626' : '#64748b',
                  }}
                >
                  <Bug size={20} />
                </div>
              </div>
              <div className="admin-kpi-value">{reportsCounts.total}</div>
              <div className="admin-kpi-footer-chips">
                <span style={{ color: '#dc2626', fontWeight: 700 }}>{reportsCounts.pending}</span> pendientes ·{' '}
                <span style={{ color: '#0284c7', fontWeight: 700 }}>{reportsCounts.inReview}</span> en revisión ·{' '}
                <span style={{ color: '#059669', fontWeight: 700 }}>{reportsCounts.resolved}</span> resueltos
              </div>
            </div>
          </div>

          {/* Actividad Reciente en Vivo (Live Feed) */}
          <div className="admin-activity-grid">
            {/* Columna Izquierda: Últimos Turnos Reservados */}
            <div className="ml-card" style={{ padding: '1.25rem 1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="#009ee3" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-title)' }}>
                    Últimos Turnos Reservados
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={() => setActiveTab('appointments')}
                  style={{ fontSize: '0.78rem' }}
                >
                  Ver todos ({stats.totalAppointments})
                </button>
              </div>

              {(stats.recentAppointments?.length ? stats.recentAppointments : appointments.slice(0, 5)).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.86rem' }}>
                  Aún no se han reservado turnos en el sistema.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(stats.recentAppointments?.length ? stats.recentAppointments : appointments.slice(0, 5)).map((apt) => (
                    <div
                      key={apt.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid #f1f5f9',
                        background: '#fafbfc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-title)' }}>
                            {apt.user?.name || 'Cliente'}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>en</span>
                          <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#0284c7' }}>
                            {apt.business?.name || 'Comercio'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span>{apt.service?.name || 'Servicio'}</span>
                          <span>·</span>
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>
                            {(() => {
                              try {
                                return `${format(new Date(apt.date), 'dd/MM/yyyy', { locale: es })} a las ${formatTimeToHHMM(apt.time)}`;
                              } catch {
                                return '—';
                              }
                            })()}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span
                          className={`badge ${
                            apt.status === 'CONFIRMED'
                              ? 'badge-confirmed'
                              : apt.status === 'COMPLETED'
                              ? 'badge-completed'
                              : apt.status === 'CANCELLED'
                              ? 'badge-cancelled'
                              : 'badge-pending'
                          }`}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {apt.status}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-light"
                          onClick={() => setInspectedAppointment(apt)}
                          style={{ padding: '4px 8px' }}
                          title="Inspeccionar turno"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Columna Derecha: Últimos Usuarios Registrados */}
            <div className="ml-card" style={{ padding: '1.25rem 1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#059669" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-title)' }}>
                    Nuevos Usuarios
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={() => setActiveTab('users')}
                  style={{ fontSize: '0.78rem' }}
                >
                  Ver todos ({stats.totalUsers})
                </button>
              </div>

              {(stats.recentUsers?.length ? stats.recentUsers : users.slice(0, 5)).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.86rem' }}>
                  No hay usuarios cargados.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(stats.recentUsers?.length ? stats.recentUsers : users.slice(0, 5)).map((u) => {
                    const initials = (u.name || u.email || 'U')
                      .split(' ')
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={u.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid #f1f5f9',
                          background: '#fafbfc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div className="admin-avatar-initials">{initials}</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-title)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {u.email}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span
                            className={`badge ${ROLE_LABELS[u.role]?.badge || 'badge-completed'}`}
                            style={{ fontSize: '0.72rem' }}
                          >
                            {ROLE_LABELS[u.role]?.label || u.role}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-light"
                            onClick={() => setInspectedUser(u)}
                            style={{ padding: '4px 8px' }}
                            title="Ver ficha del usuario"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA 2: GESTIÓN DE USUARIOS */}
      {/* ======================================================================= */}
      {activeTab === 'users' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-title)' }}>
                Base de Usuarios
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                Administrá roles, permisos y consultá el historial y comercios de cada cuenta registrada.
              </p>
            </div>

            {/* Barra de búsqueda reactiva */}
            <div style={{ position: 'relative', minWidth: '280px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, email o teléfono..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUsersPage(1);
                }}
                style={{ paddingLeft: '36px', height: '42px', borderRadius: '10px', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          {/* Chips de filtro por Rol */}
          <div className="admin-chips-filter-row">
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
              Filtrar por rol:
            </span>
            <button
              type="button"
              className={`admin-filter-chip ${userRoleFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => {
                setUserRoleFilter('ALL');
                setUsersPage(1);
              }}
            >
              Todos ({users.length})
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${userRoleFilter === 'client' ? 'active' : ''}`}
              onClick={() => {
                setUserRoleFilter('client');
                setUsersPage(1);
              }}
            >
              Clientes ({users.filter((u) => u.role === 'client').length})
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${userRoleFilter === 'owner' ? 'active' : ''}`}
              onClick={() => {
                setUserRoleFilter('owner');
                setUsersPage(1);
              }}
            >
              Dueños de Negocio ({users.filter((u) => u.role === 'owner').length})
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${userRoleFilter === 'administrator' ? 'active' : ''}`}
              onClick={() => {
                setUserRoleFilter('administrator');
                setUsersPage(1);
              }}
            >
              Administradores ({users.filter((u) => u.role === 'administrator').length})
            </button>
          </div>

          {loadingTab ? (
            <SkeletonTable rows={6} columns={6} />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Usuario
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Teléfono
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Rol Actual
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Actividad Vinculada
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Cambiar Rol
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                          No se encontraron usuarios que coincidan con la búsqueda o filtro.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u) => {
                        const initials = (u.name || u.email || 'U')
                          .split(' ')
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

                        const bizCount = u.businesses?.length ?? u._count?.businesses ?? 0;
                        const aptCount = u._count?.appointments ?? 0;

                        return (
                          <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="admin-avatar-initials">{initials}</div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-title)' }}>
                                      {u.name}
                                    </span>
                                    {u.createdAt && (Date.now() - new Date(u.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 && (
                                      <span
                                        style={{
                                          background: '#dbeafe',
                                          color: '#1d4ed8',
                                          fontSize: '0.68rem',
                                          fontWeight: 800,
                                          padding: '1px 6px',
                                          borderRadius: '8px',
                                        }}
                                        title="Cuenta creada en los últimos 7 días"
                                      >
                                        🆕 Nuevo
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                                  {u.createdAt && (
                                    <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '2px' }}>
                                      📅 Alta: {format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: es })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '0.86rem', color: '#475569' }}>
                              {u.phone || <span style={{ color: '#cbd5e1' }}>Sin registrar</span>}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span className={`badge ${ROLE_LABELS[u.role]?.badge || 'badge-completed'}`}>
                                {ROLE_LABELS[u.role]?.label || u.role}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '0.82rem' }}>
                              {bizCount > 0 ? (
                                <span
                                  style={{
                                    background: '#ecfdf5',
                                    color: '#059669',
                                    border: '1px solid #a7f3d0',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                  }}
                                >
                                  🏢 {bizCount} {bizCount === 1 ? 'comercio' : 'comercios'}
                                </span>
                              ) : aptCount > 0 ? (
                                <span
                                  style={{
                                    background: '#eff6ff',
                                    color: '#0284c7',
                                    border: '1px solid #bfdbfe',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                  }}
                                >
                                  📅 {aptCount} {aptCount === 1 ? 'turno' : 'turnos'}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>Sin comercios</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              {u.role === 'administrator' ? (
                                <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <ShieldCheck size={14} color="#0284c7" /> Protegido
                                </span>
                              ) : (
                                <select
                                  className="form-control"
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.82rem',
                                    borderRadius: '8px',
                                    borderColor: '#cbd5e1',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <option value="client">Cliente</option>
                                  <option value="owner">Dueño</option>
                                </select>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light"
                                  onClick={() => setInspectedUser(u)}
                                  style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                                  title="Ver ficha completa de usuario"
                                >
                                  <Eye size={14} /> Ficha
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light-danger"
                                  onClick={() => setUserToDelete({ id: u.id, name: u.name })}
                                  style={{ padding: '5px 9px' }}
                                  title="Eliminar usuario de la plataforma"
                                  disabled={u.id === user?.id}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={usersPage}
                totalPages={totalUsersPages}
                totalItems={filteredUsers.length}
                itemsPerPage={PER_PAGE}
                onPageChange={setUsersPage}
                itemLabel="usuarios"
              />
            </>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA 3: GESTIÓN DE COMERCIOS */}
      {/* ======================================================================= */}
      {activeTab === 'businesses' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-title)' }}>
                Comercios y Negocios Registrados
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                Monitoreá los locales adheridos a Turnos Ya, sus categorías, dueños y servicios activos.
              </p>
            </div>

            {/* Buscador de comercios */}
            <div style={{ position: 'relative', minWidth: '280px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por negocio, dirección o dueño..."
                value={bizSearch}
                onChange={(e) => {
                  setBizSearch(e.target.value);
                  setBizPage(1);
                }}
                style={{ paddingLeft: '36px', height: '42px', borderRadius: '10px', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          {/* Filtros por Estado de Moderación */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
              Estado de Alta:
            </span>
            <button
              type="button"
              className={`admin-filter-chip ${bizStatusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => {
                setBizStatusFilter('ALL');
                setBizPage(1);
              }}
            >
              Todos ({businesses.length})
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${bizStatusFilter === 'pending_approval' ? 'active' : ''}`}
              onClick={() => {
                setBizStatusFilter('pending_approval');
                setBizPage(1);
              }}
              style={pendingBizCount > 0 ? { borderColor: '#f59e0b', color: '#b45309', fontWeight: 700 } : {}}
            >
              ⏳ Pendientes de Alta ({pendingBizCount})
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${bizStatusFilter === 'approved' ? 'active' : ''}`}
              onClick={() => {
                setBizStatusFilter('approved');
                setBizPage(1);
              }}
            >
              ✓ Aprobados ({approvedBizCount})
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${bizStatusFilter === 'rejected' ? 'active' : ''}`}
              onClick={() => {
                setBizStatusFilter('rejected');
                setBizPage(1);
              }}
            >
              ✕ Observados ({rejectedBizCount})
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${bizStatusFilter === 'suspended' ? 'active' : ''}`}
              onClick={() => {
                setBizStatusFilter('suspended');
                setBizPage(1);
              }}
              style={suspendedBizCount > 0 ? { borderColor: '#ea580c', color: '#c2410c', fontWeight: 700 } : {}}
            >
              ⏸ Suspendidos ({suspendedBizCount})
            </button>
          </div>

          {/* Chips de filtro por categoría */}
          <div className="admin-chips-filter-row" style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
              Categoría:
            </span>
            <button
              type="button"
              className={`admin-filter-chip ${bizCategoryFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => {
                setBizCategoryFilter('ALL');
                setBizPage(1);
              }}
            >
              Todas
            </button>
            {categoriesList.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`admin-filter-chip ${bizCategoryFilter === cat ? 'active' : ''}`}
                onClick={() => {
                  setBizCategoryFilter(cat);
                  setBizPage(1);
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {loadingTab ? (
            <SkeletonTable rows={6} columns={7} />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Comercio
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Estado
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Ubicación y Contacto
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Evidencias de Veracidad
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Dueño Responsable
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBusinesses.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                          No se encontraron comercios con los criterios de búsqueda.
                        </td>
                      </tr>
                    ) : (
                      paginatedBusinesses.map((b: any) => {
                        const initial = (b.name || 'B')[0].toUpperCase();
                        const bStatus = b.status || 'approved';

                        return (
                          <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', background: bStatus === 'pending_approval' ? '#fffbeb' : undefined }}>
                            <td style={{ padding: '12px 14px' }}>
                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                onClick={() => setInspectedBusiness(b)}
                                title="Hacé clic para ver la ficha completa y evidencias"
                              >
                                <div
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    background: bStatus === 'pending_approval' ? '#fef3c7' : '#e0f2fe',
                                    color: bStatus === 'pending_approval' ? '#b45309' : '#0284c7',
                                    fontWeight: 800,
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {initial}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0369a1' }}>
                                      {b.name}
                                    </span>
                                    {b.createdAt && (Date.now() - new Date(b.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 && (
                                      <span
                                        style={{
                                          background: '#dbeafe',
                                          color: '#1d4ed8',
                                          fontSize: '0.68rem',
                                          fontWeight: 800,
                                          padding: '1px 6px',
                                          borderRadius: '8px',
                                        }}
                                        title="Comercio registrado en los últimos 7 días"
                                      >
                                        🆕 Nuevo
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <span>ID #{b.id}</span>
                                    <span>•</span>
                                    <span>{b.category || b.categoryRel?.name || 'General'}</span>
                                    {b.createdAt && (
                                      <>
                                        <span>•</span>
                                        <span style={{ color: '#475569', fontWeight: 600 }}>
                                          📅 Alta: {format(new Date(b.createdAt), 'dd/MM/yyyy', { locale: es })}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '12px 14px' }}>
                              {bStatus === 'pending_approval' && (
                                <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', padding: '4px 8px' }}>
                                  <Clock size={12} /> En Revisión
                                </span>
                              )}
                              {bStatus === 'approved' && (
                                <span className="badge badge-confirmed" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', padding: '4px 8px' }}>
                                  ✓ Activo
                                </span>
                              )}
                              {bStatus === 'suspended' && (
                                <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', padding: '4px 8px', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }} title={b.rejectionReason || 'Suspendido temporalmente'}>
                                  ⏸ Suspendido
                                </span>
                              )}
                              {bStatus === 'rejected' && (
                                <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', padding: '4px 8px' }} title={b.rejectionReason || 'Observado'}>
                                  ✕ Observado
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '12px 14px', fontSize: '0.84rem' }}>
                              <div style={{ color: 'var(--text-title)', fontWeight: 600 }}>
                                {b.address || <span style={{ color: '#cbd5e1' }}>Sin dirección</span>}
                              </div>
                              {b.city && <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{b.city}, {b.province}</div>}
                              {b.phone && (
                                <div style={{ fontSize: '0.76rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                  <Phone size={11} /> {b.phone}
                                </div>
                              )}
                            </td>

                            {/* Evidencias de Veracidad */}
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {b.instagramUrl && (
                                  <a
                                    href={b.instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fff1f2', color: '#e1306c', border: '1px solid #fecdd3', borderRadius: '6px', padding: '3px 7px', fontSize: '0.74rem', fontWeight: 700, textDecoration: 'none' }}
                                    title="Verificar perfil de Instagram"
                                  >
                                    <InstagramIcon size={12} /> IG
                                  </a>
                                )}
                                {b.facebookUrl && (
                                  <a
                                    href={b.facebookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#1877f2', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '3px 7px', fontSize: '0.74rem', fontWeight: 700, textDecoration: 'none' }}
                                    title="Verificar página de Facebook"
                                  >
                                    <FacebookIcon size={12} /> FB
                                  </a>
                                )}
                                {b.googleMapsUrl && (
                                  <a
                                    href={b.googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', color: '#ea4335', border: '1px solid #fecaca', borderRadius: '6px', padding: '3px 7px', fontSize: '0.74rem', fontWeight: 700, textDecoration: 'none' }}
                                    title="Verificar en Google Maps"
                                  >
                                    <MapPin size={12} /> Maps
                                  </a>
                                )}
                                {b.websiteUrl && (
                                  <a
                                    href={b.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '6px', padding: '3px 7px', fontSize: '0.74rem', fontWeight: 700, textDecoration: 'none' }}
                                    title="Verificar sitio web oficial"
                                  >
                                    <Globe size={12} /> Web
                                  </a>
                                )}
                                {b.cuit && (
                                  <span style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px 7px', fontSize: '0.74rem', fontWeight: 700 }}>
                                    CUIT: {b.cuit}
                                  </span>
                                )}
                                {!b.instagramUrl && !b.facebookUrl && !b.googleMapsUrl && !b.websiteUrl && !b.cuit && (
                                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Sin evidencias</span>
                                )}
                              </div>
                            </td>

                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-title)' }}>
                                {b.owner?.name || 'Sin dueño'}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{b.owner?.email}</div>
                              {b.phone && (
                                <a
                                  href={`https://wa.me/${b.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#16a34a', fontWeight: 700, marginTop: '2px', textDecoration: 'none' }}
                                >
                                  <MessageCircle size={11} /> WhatsApp
                                </a>
                              )}
                            </td>

                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light"
                                  onClick={() => setInspectedBusiness(b)}
                                  style={{
                                    fontSize: '0.8rem',
                                    padding: '5px 10px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#0369a1',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                                  }}
                                  title="Ver ficha completa y evidencias del comercio"
                                >
                                  <Eye size={14} color="#0284c7" />
                                  <span>Ficha</span>
                                </button>

                                {bStatus === 'pending_approval' && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      onClick={() => setBusinessToApprove(b)}
                                      style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', fontSize: '0.78rem', fontWeight: 700, borderRadius: '6px' }}
                                      title="Aprobar comercio y publicar en catálogo"
                                    >
                                      ✓ Aprobar
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      onClick={() => {
                                        setBusinessToReject(b);
                                        setRejectionReasonInput('');
                                      }}
                                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', fontSize: '0.78rem', fontWeight: 700, borderRadius: '6px' }}
                                      title="Observar o rechazar solicitud"
                                    >
                                      ✕ Observar
                                    </button>
                                  </>
                                )}

                                {bStatus === 'approved' && (
                                  <>
                                    <a
                                      href={`/businesses/${b.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-sm btn-outline-primary"
                                      style={{ padding: '5px 9px', fontSize: '0.8rem' }}
                                      title="Abrir página pública del comercio"
                                    >
                                      <ExternalLink size={13} />
                                    </a>
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      onClick={() => {
                                        setBusinessToSuspend(b);
                                        setSuspendReasonInput('');
                                      }}
                                      style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '5px 8px', fontSize: '0.76rem', fontWeight: 700, borderRadius: '6px' }}
                                      title="Suspender comercio temporalmente"
                                    >
                                      ⏸ Suspender
                                    </button>
                                  </>
                                )}

                                {bStatus === 'suspended' && (
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={() => setBusinessToReactivate(b)}
                                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', fontSize: '0.78rem', fontWeight: 700, borderRadius: '6px' }}
                                    title="Reactivar comercio y habilitar en catálogo"
                                  >
                                    ▶ Reactivar
                                  </button>
                                )}

                                {bStatus === 'rejected' && (
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={() => setBusinessToApprove(b)}
                                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', fontSize: '0.78rem', fontWeight: 700, borderRadius: '6px' }}
                                    title="Re-aprobar comercio"
                                  >
                                    ✓ Aprobar
                                  </button>
                                )}

                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  onClick={() => {
                                    setBusinessToDelete(b);
                                    setDeleteBizReasonInput('');
                                    setDeleteBizAlsoOwner(false);
                                  }}
                                  style={{
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    border: '1px solid #fecaca',
                                    padding: '5px 8px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Rechazar definitivamente y eliminar de la base de datos (Fraude / Baja con registro forense en Auditoría)"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={bizPage}
                totalPages={totalBizPages}
                totalItems={filteredBusinesses.length}
                itemsPerPage={PER_PAGE}
                onPageChange={setBizPage}
                itemLabel="comercios"
              />
            </>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA 4: LISTADO MAESTRO DE TURNOS */}
      {/* ======================================================================= */}
      {activeTab === 'appointments' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-title)' }}>
                Listado Maestro de Turnos
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                Control y auditoría global de reservas, asistencias y cancelaciones en todos los comercios.
              </p>
            </div>

            {/* Buscador de turnos */}
            <div style={{ position: 'relative', minWidth: '280px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por cliente, comercio o ID..."
                value={aptSearch}
                onChange={(e) => {
                  setAptSearch(e.target.value);
                  setAptPage(1);
                }}
                style={{ paddingLeft: '36px', height: '42px', borderRadius: '10px', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          {/* Filtros rápidos: Estado y Fecha */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="admin-chips-filter-row" style={{ margin: 0 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
                Estado:
              </span>
              <button
                type="button"
                className={`admin-filter-chip ${aptStatusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => {
                  setAptStatusFilter('ALL');
                  setAptPage(1);
                }}
              >
                Todos ({appointments.length})
              </button>
              <button
                type="button"
                className={`admin-filter-chip ${aptStatusFilter === 'CONFIRMED' ? 'active' : ''}`}
                onClick={() => {
                  setAptStatusFilter('CONFIRMED');
                  setAptPage(1);
                }}
              >
                Confirmados ({appointments.filter((a) => a.status === 'CONFIRMED').length})
              </button>
              <button
                type="button"
                className={`admin-filter-chip ${aptStatusFilter === 'PENDING' ? 'active' : ''}`}
                onClick={() => {
                  setAptStatusFilter('PENDING');
                  setAptPage(1);
                }}
              >
                Pendientes ({appointments.filter((a) => a.status === 'PENDING').length})
              </button>
              <button
                type="button"
                className={`admin-filter-chip ${aptStatusFilter === 'COMPLETED' ? 'active' : ''}`}
                onClick={() => {
                  setAptStatusFilter('COMPLETED');
                  setAptPage(1);
                }}
              >
                Completados ({appointments.filter((a) => a.status === 'COMPLETED').length})
              </button>
              <button
                type="button"
                className={`admin-filter-chip ${aptStatusFilter === 'CANCELLED' ? 'active' : ''}`}
                onClick={() => {
                  setAptStatusFilter('CANCELLED');
                  setAptPage(1);
                }}
              >
                Cancelados ({appointments.filter((a) => a.status === 'CANCELLED').length})
              </button>
            </div>

            {/* Filtro por fecha */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>Fecha:</span>
              <select
                className="form-control"
                value={aptDateFilter}
                onChange={(e) => {
                  setAptDateFilter(e.target.value as any);
                  setAptPage(1);
                }}
                style={{ padding: '6px 12px', fontSize: '0.82rem', width: 'auto' }}
              >
                <option value="ALL">Todas las fechas</option>
                <option value="TODAY">Turnos de Hoy</option>
                <option value="UPCOMING">Próximos turnos</option>
                <option value="PAST">Turnos pasados</option>
              </select>
            </div>
          </div>

          {loadingTab ? (
            <SkeletonTable rows={6} columns={6} />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        ID
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Cliente
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Comercio & Servicio
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Fecha y Hora
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Estado
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                          No se encontraron turnos con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      paginatedAppointments.map((apt) => (
                        <tr key={apt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
                            #{apt.id}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-title)' }}>
                              {apt.user?.name || 'Cliente'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{apt.user?.email}</div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0284c7' }}>
                              {apt.business?.name || 'Comercio'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                              {apt.service?.name} {apt.service?.price ? `($${apt.service.price})` : ''}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-title)' }}>
                              {(() => {
                                try {
                                  return format(new Date(apt.date), 'dd/MM/yyyy', { locale: es });
                                } catch {
                                  return '—';
                                }
                              })()}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {formatTimeToHHMM(apt.time)} hs
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              className={`badge ${
                                apt.status === 'CONFIRMED'
                                  ? 'badge-confirmed'
                                  : apt.status === 'COMPLETED'
                                  ? 'badge-completed'
                                  : apt.status === 'CANCELLED'
                                  ? 'badge-cancelled'
                                  : 'badge-pending'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-light"
                              onClick={() => setInspectedAppointment(apt)}
                              style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                              title="Inspeccionar turno"
                            >
                              <Eye size={14} /> Ficha
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={aptPage}
                totalPages={totalAptPages}
                totalItems={filteredAppointments.length}
                itemsPerPage={PER_PAGE}
                onPageChange={setAptPage}
                itemLabel="turnos"
              />
            </>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA 5: REPORTES DE ERRORES Y TICKETS TÉCNICOS */}
      {/* ======================================================================= */}
      {activeTab === 'reports' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-title)' }}>
                Bandeja de Tickets y Reportes de Errores
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                Atención, diagnóstico y resolución de errores reportados por los usuarios de Turnos Ya.
              </p>
            </div>

            {/* Filtro por estado de reporte */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="#64748b" />
              <select
                className="form-control"
                value={reportsStatusFilter}
                onChange={(e) => {
                  setReportsStatusFilter(e.target.value);
                  setReportsPage(1);
                }}
                style={{ padding: '7px 12px', fontSize: '0.85rem', width: 'auto', minWidth: '160px' }}
              >
                <option value="ALL">Todos ({reportsCounts.total})</option>
                <option value="PENDING">Pendientes ({reportsCounts.pending})</option>
                <option value="IN_REVIEW">En revisión ({reportsCounts.inReview})</option>
                <option value="RESOLVED">Resueltos ({reportsCounts.resolved})</option>
                <option value="DISCARDED">Descartados ({reportsCounts.discarded})</option>
              </select>
            </div>
          </div>

          {/* Chips de filtro por tipo de ticket */}
          <div className="admin-chips-filter-row" style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
              Tipo de solicitud:
            </span>
            <button
              type="button"
              className={`admin-filter-chip ${reportsTypeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setReportsTypeFilter('ALL')}
            >
              Todos ({reports.length})
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${reportsTypeFilter === 'SOLICITUD_RUBRO' ? 'active' : ''}`}
              onClick={() => setReportsTypeFilter('SOLICITUD_RUBRO')}
            >
              🏷️ Nuevos Rubros ({reports.filter((r) => r.section === 'SOLICITUD_RUBRO').length})
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${reportsTypeFilter === 'MODERACION_RESENA' ? 'active' : ''}`}
              onClick={() => setReportsTypeFilter('MODERACION_RESENA')}
            >
              🚩 Moderación de Reseñas ({reports.filter((r) => r.section === 'MODERACION_RESENA').length})
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${reportsTypeFilter === 'BUG' ? 'active' : ''}`}
              onClick={() => setReportsTypeFilter('BUG')}
            >
              🐛 Errores Técnicos ({reports.filter((r) => r.section !== 'SOLICITUD_RUBRO' && r.section !== 'MODERACION_RESENA').length})
            </button>
          </div>

          {loadingTab ? (
            <SkeletonTable rows={5} columns={6} />
          ) : reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-title)' }}>
                No hay tickets en este estado
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                {reportsStatusFilter === 'PENDING'
                  ? '¡Excelente! No hay tickets pendientes de atención en el sistema.'
                  : 'No se encontraron reportes con el filtro seleccionado.'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Fecha
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Usuario
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Sección
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Resumen del Error
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Estado
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports
                      .filter((r) => {
                        if (reportsTypeFilter === 'ALL') return true;
                        if (reportsTypeFilter === 'SOLICITUD_RUBRO') return r.section === 'SOLICITUD_RUBRO';
                        if (reportsTypeFilter === 'MODERACION_RESENA') return r.section === 'MODERACION_RESENA';
                        return r.section !== 'SOLICITUD_RUBRO' && r.section !== 'MODERACION_RESENA';
                      })
                      .map((report) => (
                      <tr key={report.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap', color: '#64748b' }}>
                          {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-title)' }}>
                            {report.user?.name || 'Usuario'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{report.user?.email}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {report.section === 'MODERACION_RESENA' ? (
                            <span
                              style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                padding: '3px 8px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                color: '#dc2626',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Flag size={12} /> Moderación Reseña
                            </span>
                          ) : report.section === 'SOLICITUD_RUBRO' ? (
                            <span
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '8px',
                                padding: '3px 8px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                color: '#2563eb',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Tags size={12} /> Solicitud Rubro
                            </span>
                          ) : (
                            <span
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '2px 8px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#334155',
                                display: 'inline-block',
                                maxWidth: '170px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={report.section}
                            >
                              {report.section}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: '280px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-title)' }}>
                            {report.summary}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <select
                            value={report.status}
                            disabled={savingReportId === report.id}
                            onChange={(e) => handleReportStatusChange(report.id, e.target.value)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: '1px solid #cbd5e1',
                              background:
                                report.status === 'RESOLVED'
                                  ? '#ecfdf5'
                                  : report.status === 'IN_REVIEW'
                                  ? '#eff6ff'
                                  : report.status === 'PENDING'
                                  ? '#fffbeb'
                                  : '#f1f5f9',
                              color:
                                report.status === 'RESOLVED'
                                  ? '#059669'
                                  : report.status === 'IN_REVIEW'
                                  ? '#0284c7'
                                  : report.status === 'PENDING'
                                  ? '#d97706'
                                  : '#64748b',
                            }}
                          >
                            <option value="PENDING">Pendiente</option>
                            <option value="IN_REVIEW">En revisión</option>
                            <option value="RESOLVED">Resuelto</option>
                            <option value="DISCARDED">Descartado</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-light"
                            onClick={() => {
                              setSelectedReport(report);
                              setAdminNotesInput(report.adminNotes || '');
                            }}
                            style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                          >
                            <Eye size={14} /> Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={reportsPage}
                totalPages={reportsTotalPages}
                totalItems={reportsCounts.total}
                itemsPerPage={PER_PAGE}
                onPageChange={setReportsPage}
                itemLabel="reportes"
              />
            </>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA 7: GESTIÓN DE RUBROS Y CATEGORÍAS */}
      {/* ======================================================================= */}
      {activeTab === 'categories' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-title)' }}>
                Gestor Dinámico de Rubros y Categorías
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                Administra los rubros comerciales disponibles para el alta de negocios y la búsqueda por categoría en TurnosYa.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar categoría..."
                  value={categoriesSearch}
                  onChange={(e) => setCategoriesSearch(e.target.value)}
                  style={{ paddingLeft: '36px', height: '42px', borderRadius: '10px', fontSize: '0.88rem' }}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleOpenCategoryModal()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 4px rgba(0, 158, 227, 0.25)'
                }}
              >
                <Plus size={16} />
                <span>Nueva Categoría</span>
              </button>
            </div>
          </div>

          {loadingTab ? (
            <SkeletonTable rows={6} columns={6} />
          ) : (() => {
            const filteredCategories = categories.filter((cat) => {
              if (!categoriesSearch.trim()) return true;
              const term = categoriesSearch.toLowerCase();
              return (
                cat.name?.toLowerCase().includes(term) ||
                cat.slug?.toLowerCase().includes(term) ||
                cat.description?.toLowerCase().includes(term)
              );
            });

            if (filteredCategories.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f1f5f9', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <Tags size={28} />
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontWeight: 800, color: 'var(--text-title)' }}>
                    No se encontraron categorías
                  </h4>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.86rem', color: '#64748b' }}>
                    {categoriesSearch ? 'No hay categorías que coincidan con la búsqueda.' : 'Aún no se han configurado categorías comerciales.'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenCategoryModal()}
                  >
                    Crear primera categoría
                  </button>
                </div>
              );
            }

            return (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px' }}>Ícono</th>
                      <th style={{ padding: '12px 14px' }}>Categoría / Slug</th>
                      <th style={{ padding: '12px 14px' }}>Descripción</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Comercios</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Estado</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((cat) => {
                      const bizCount = cat._count?.businesses ?? 0;
                      return (
                        <tr key={cat.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              {cat.icon || '🏢'}
                            </div>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 800, color: 'var(--text-title)' }}>{cat.name}</div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b', fontFamily: 'monospace' }}>
                              /{cat.slug}
                            </div>
                          </td>

                          <td style={{ padding: '12px 14px', color: '#475569', maxWidth: '280px' }}>
                            {cat.description ? (
                              <span style={{ fontSize: '0.84rem' }}>{cat.description}</span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>Sin descripción</span>
                            )}
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <span
                              className={`badge ${bizCount > 0 ? 'badge-confirmed' : 'badge-completed'}`}
                              style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                            >
                              {bizCount} {bizCount === 1 ? 'comercio' : 'comercios'}
                            </span>
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleCategory(cat)}
                              style={{
                                background: cat.isActive !== false ? '#ecfdf5' : '#f1f5f9',
                                color: cat.isActive !== false ? '#059669' : '#64748b',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                border: `1px solid ${cat.isActive !== false ? '#a7f3d0' : '#cbd5e1'}`
                              }}
                              title={cat.isActive !== false ? 'Click para desactivar' : 'Click para activar'}
                            >
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  background: cat.isActive !== false ? '#10b981' : '#94a3b8'
                                }}
                              />
                              {cat.isActive !== false ? 'Activa' : 'Inactiva'}
                            </button>
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-sm btn-light"
                                onClick={() => handleOpenCategoryModal(cat)}
                                style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                title="Editar categoría"
                              >
                                <Edit2 size={13} />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-light"
                                onClick={() => setCategoryToDelete(cat)}
                                disabled={bizCount > 0}
                                style={{
                                  color: bizCount > 0 ? '#94a3b8' : '#dc2626',
                                  background: bizCount > 0 ? '#f1f5f9' : '#fef2f2',
                                  borderColor: bizCount > 0 ? '#e2e8f0' : '#fecaca',
                                  padding: '6px 10px',
                                  fontSize: '0.78rem',
                                  cursor: bizCount > 0 ? 'not-allowed' : 'pointer'
                                }}
                                title={bizCount > 0 ? 'No se puede eliminar: tiene comercios asociados' : 'Eliminar categoría'}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA 8: AVISOS Y BANNERS DEL SISTEMA */}
      {/* ======================================================================= */}
      {activeTab === 'announcements' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-title)' }}>
                Avisos del Sistema & Banners Globales
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                Transmite avisos oficiales, mantenimientos preventivos o alertas urgentes en la barra superior a todos los visitantes.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setAnnouncementForm({
                  message: '',
                  type: 'info',
                  linkUrl: '',
                  linkText: '',
                  expiresAt: '',
                });
                setAnnouncementModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '0.88rem',
                padding: '10px 18px',
                borderRadius: '10px',
                boxShadow: '0 2px 4px rgba(0, 158, 227, 0.25)'
              }}
            >
              <Plus size={16} />
              <span>Nuevo Comunicado</span>
            </button>
          </div>

          {/* Tarjeta de Guía Rápida */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Megaphone size={18} />
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.45 }}>
              El aviso activo más reciente se muestra de inmediato en la cabecera superior en todas las pantallas. Los usuarios pueden cerrarlo temporalmente en su sesión si ya lo leyeron. Puedes programar una fecha de vencimiento automático o pausarlo cuando lo desees.
            </div>
          </div>

          {loadingTab ? (
            <SkeletonTable rows={4} columns={5} />
          ) : announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f1f5f9', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Megaphone size={28} />
              </div>
              <h4 style={{ margin: '0 0 6px', fontWeight: 800, color: 'var(--text-title)' }}>
                No hay comunicados registrados
              </h4>
              <p style={{ margin: '0 0 1rem', fontSize: '0.86rem', color: '#64748b' }}>
                Crea un aviso para notificar a la comunidad sobre mantenimientos, novedades o información importante.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setAnnouncementModalOpen(true)}
              >
                Crear primer comunicado
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px' }}>Tipo / Nivel</th>
                    <th style={{ padding: '12px 14px' }}>Mensaje del Comunicado</th>
                    <th style={{ padding: '12px 14px' }}>Enlace / Acción</th>
                    <th style={{ padding: '12px 14px' }}>Vencimiento</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Estado</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((ann) => {
                    const typeConfig: Record<string, { label: string; bg: string; color: string; border: string }> = {
                      info: { label: 'Informativo', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
                      warning: { label: 'Advertencia', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
                      danger: { label: 'Urgente / Peligro', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
                      success: { label: 'Novedad / Éxito', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
                    };
                    const badge = typeConfig[ann.type] || typeConfig.info;

                    return (
                      <tr key={ann.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              borderRadius: '20px',
                              padding: '3px 10px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'inline-block'
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-title)', maxWidth: '380px' }}>
                          {ann.message}
                        </td>

                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {ann.linkUrl ? (
                            <a
                              href={ann.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#0284c7', textDecoration: 'underline', fontWeight: 600, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              {ann.linkText || 'Ver enlace'} <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Sin enlace</span>
                          )}
                        </td>

                        <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#64748b' }}>
                          {ann.expiresAt ? (
                            <span>{new Date(ann.expiresAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          ) : (
                            <span style={{ color: '#059669', fontWeight: 600 }}>Permanente</span>
                          )}
                        </td>

                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleAnnouncement(ann)}
                            style={{
                              background: ann.isActive ? '#ecfdf5' : '#f1f5f9',
                              color: ann.isActive ? '#059669' : '#64748b',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              border: `1px solid ${ann.isActive ? '#a7f3d0' : '#cbd5e1'}`
                            }}
                            title={ann.isActive ? 'Click para pausar aviso' : 'Click para activar aviso'}
                          >
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: ann.isActive ? '#10b981' : '#94a3b8'
                              }}
                            />
                            {ann.isActive ? 'Activo' : 'Pausado'}
                          </button>
                        </td>

                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-light"
                            onClick={() => setAnnouncementToDelete(ann)}
                            style={{ color: '#dc2626', background: '#fef2f2', borderColor: '#fecaca', padding: '6px 10px', fontSize: '0.78rem' }}
                            title="Eliminar aviso permanentemente"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA 9: AUDITORÍA DEL SISTEMA (AUDIT TRAIL) */}
      {/* ======================================================================= */}
      {activeTab === 'audit' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-title)' }}>
                Registro de Auditoría del Sistema (*Audit Trail*)
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                Bitácora de seguridad con las acciones críticas ejecutadas por administradores en la plataforma.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar en auditoría..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setAuditPage(1);
                      fetchTabData();
                    }
                  }}
                  style={{ paddingLeft: '36px', height: '42px', borderRadius: '10px', fontSize: '0.88rem' }}
                />
              </div>

              <select
                className="form-select"
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                  setAuditPage(1);
                }}
                style={{ height: '42px', borderRadius: '10px', fontSize: '0.88rem', padding: '0 12px', border: '1px solid #cbd5e1' }}
              >
                <option value="ALL">Todas las Acciones</option>
                <option value="BUSINESS_DELETED_FRAUD">🗑️ Baja Definitiva / Fraude Comercio</option>
                <option value="EMERGENCY_CANCELLATION">🚨 Cancelación de Emergencia</option>
                <option value="BUSINESS_SUSPENDED">⏸ Suspensión de Comercio</option>
                <option value="BUSINESS_REACTIVATED">▶ Reactivación de Comercio</option>
                <option value="REVIEW_DELETED">🗑 Reseña Moderada</option>
                <option value="BUSINESS_APPROVED">✓ Comercio Aprobado</option>
                <option value="BUSINESS_REJECTED">✕ Comercio Observado</option>
              </select>
            </div>
          </div>

          {loadingTab ? (
            <SkeletonTable rows={8} columns={6} />
          ) : auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f1f5f9', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <History size={28} />
              </div>
              <h4 style={{ margin: '0 0 6px', fontWeight: 800, color: 'var(--text-title)' }}>
                No se registraron eventos de auditoría
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b' }}>
                No hay registros con los filtros seleccionados o el historial está limpio.
              </p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Fecha / Hora</th>
                      <th style={{ padding: '10px 12px' }}>Administrador</th>
                      <th style={{ padding: '10px 12px' }}>Acción</th>
                      <th style={{ padding: '10px 12px' }}>Entidad</th>
                      <th style={{ padding: '10px 12px' }}>Detalles</th>
                      <th style={{ padding: '10px 12px' }}>IP</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Ver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => {
                      const actionBadgeConfig: Record<string, { label: string; bg: string; color: string; border: string }> = {
                        BUSINESS_DELETED_FRAUD: { label: 'Baja Definitiva / Fraude', bg: '#fef2f2', color: '#991b1b', border: '#f87171' },
                        EMERGENCY_CANCELLATION: { label: 'Cancelación Emergencia', bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
                        BUSINESS_SUSPENDED: { label: 'Comercio Suspendido', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
                        BUSINESS_REACTIVATED: { label: 'Comercio Reactivado', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
                        REVIEW_DELETED: { label: 'Reseña Moderada', bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
                        BUSINESS_APPROVED: { label: 'Comercio Aprobado', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
                        BUSINESS_REJECTED: { label: 'Comercio Observado', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
                      };
                      const actionBadge = actionBadgeConfig[log.action] || {
                        label: log.action,
                        bg: '#f1f5f9',
                        color: '#475569',
                        border: '#e2e8f0',
                      };

                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#475569', fontSize: '0.8rem' }}>
                            {log.createdAt ? (
                              <span>
                                {new Date(log.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                                <strong>{new Date(log.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</strong>
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>

                          <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-title)' }}>
                            {log.adminName || `Admin #${log.adminId}`}
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                background: actionBadge.bg,
                                color: actionBadge.color,
                                border: `1px solid ${actionBadge.border}`,
                                borderRadius: '20px',
                                padding: '3px 9px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                display: 'inline-block'
                              }}
                            >
                              {actionBadge.label}
                            </span>
                          </td>

                          <td style={{ padding: '10px 12px', fontSize: '0.82rem', color: '#475569' }}>
                            <strong style={{ color: 'var(--text-title)' }}>{log.targetType}</strong>
                            {log.targetId && (
                              <span style={{ color: '#64748b', marginLeft: '4px' }}>#{log.targetId}</span>
                            )}
                          </td>

                          <td style={{ padding: '10px 12px', maxWidth: '320px', fontSize: '0.8rem', color: '#334155' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details}>
                              {log.details || '—'}
                            </div>
                          </td>

                          <td style={{ padding: '10px 12px', fontSize: '0.76rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {log.ipAddress || '—'}
                          </td>

                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-light"
                              onClick={() => setSelectedAuditLog(log)}
                              style={{ padding: '5px 8px', fontSize: '0.74rem' }}
                              title="Ver detalles completos del evento"
                            >
                              <Eye size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={auditPage}
                totalPages={auditTotalPages}
                totalItems={auditTotal}
                itemsPerPage={20}
                onPageChange={setAuditPage}
                itemLabel="eventos de auditoría"
              />
            </>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 1: FICHA RÁPIDA DE USUARIO */}
      {/* ======================================================================= */}
      {inspectedUser && (
        <div className="modal-overlay" onClick={() => setInspectedUser(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '100%' }}>
            <div className="modal-drag-handle" />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284c7 0%, #009ee3 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {(inspectedUser.name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    {inspectedUser.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <span className={`badge ${ROLE_LABELS[inspectedUser.role]?.badge || 'badge-completed'}`}>
                      {ROLE_LABELS[inspectedUser.role]?.label || inspectedUser.role}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>ID #{inspectedUser.id}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedUser(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Datos de contacto y trazabilidad de la cuenta */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '1.25rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, display: 'block' }}>
                  CORREO ELECTRÓNICO
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-title)', wordBreak: 'break-all' }}>
                  {inspectedUser.email}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, display: 'block' }}>
                  TELÉFONO
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-title)' }}>
                  {inspectedUser.phone || 'Sin registrar'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, display: 'block' }}>
                  FECHA DE CREACIÓN DE CUENTA
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-title)' }}>
                    {inspectedUser.createdAt
                      ? format(new Date(inspectedUser.createdAt), "d 'de' MMMM, yyyy · HH:mm 'hs'", { locale: es })
                      : 'Sin registro'}
                  </span>
                  {inspectedUser.createdAt && (Date.now() - new Date(inspectedUser.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 && (
                    <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.7rem', fontWeight: 800, padding: '1px 6px', borderRadius: '8px' }}>
                      🆕 Nuevo (&lt; 7 días)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, display: 'block' }}>
                  VERIFICACIÓN DE CORREO
                </span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: inspectedUser.emailVerified ? '#059669' : '#d97706',
                    display: 'inline-block',
                    marginTop: '2px',
                  }}
                >
                  {inspectedUser.emailVerified ? '✓ Email Verificado' : '⏳ Pendiente de verificar'}
                </span>
              </div>
            </div>

            {/* Comercios que administra (si es dueño) */}
            {inspectedUser.businesses && inspectedUser.businesses.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                  Comercios Administrados ({inspectedUser.businesses.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {inspectedUser.businesses.map((b: any) => (
                    <div
                      key={b.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-title)' }}>{b.name}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '6px' }}>({b.category || 'General'})</span>
                        {b.createdAt && (
                          <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '2px' }}>
                            📅 Creado el {format(new Date(b.createdAt), 'dd/MM/yyyy', { locale: es })}
                          </div>
                        )}
                      </div>
                      <a
                        href={`/businesses/${b.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-light"
                        style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                      >
                        Ver comercio
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Asignación de rol: Sólo disponible en la pestaña 'Usuarios' y sólo entre Cliente y Dueño */}
            {activeTab === 'users' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Modificar rol del usuario:
                </label>
                {inspectedUser.role === 'administrator' ? (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#475569',
                      fontSize: '0.82rem',
                    }}
                  >
                    <ShieldCheck size={16} color="#0284c7" />
                    <span>Rol de Administrador protegido por seguridad del sistema (no modificable).</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['client', 'owner'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleChange(inspectedUser.id, r)}
                        className={`btn btn-sm ${inspectedUser.role === r ? 'btn-primary' : 'btn-light'}`}
                        style={{ flex: 1, fontSize: '0.82rem' }}
                      >
                        {inspectedUser.role === r && <Check size={13} />} {ROLE_LABELS[r]?.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="modal-footer-responsive" style={{ margin: 0 }}>
              <button type="button" className="btn btn-light" onClick={() => setInspectedUser(null)}>
                Cerrar ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 2: FICHA RÁPIDA DE COMERCIO */}
      {/* ======================================================================= */}
      {inspectedBusiness && (
        <div className="modal-overlay" onClick={() => setInspectedBusiness(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '780px', width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-drag-handle" />

            {/* Cabecera del Dossier */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: inspectedBusiness.status === 'pending_approval' ? '#fef3c7' : inspectedBusiness.status === 'rejected' ? '#fee2e2' : '#e0f2fe',
                    color: inspectedBusiness.status === 'pending_approval' ? '#b45309' : inspectedBusiness.status === 'rejected' ? '#dc2626' : '#0284c7',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                  }}
                >
                  {(inspectedBusiness.name || 'B')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-title)' }}>
                      {inspectedBusiness.name}
                    </h3>
                    {inspectedBusiness.status === 'pending_approval' && (
                      <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', padding: '4px 8px' }}>
                        <Clock size={12} /> ⏳ En Revisión por Administración
                      </span>
                    )}
                    {inspectedBusiness.status === 'approved' && (
                      <span className="badge badge-confirmed" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', padding: '4px 8px' }}>
                        <CheckCircle2 size={12} /> ✓ Comercio Activo
                      </span>
                    )}
                    {inspectedBusiness.status === 'rejected' && (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', padding: '4px 8px' }}>
                        <AlertTriangle size={12} /> ✕ Observado / Requiere Cambios
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                    <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, color: '#334155' }}>
                      {inspectedBusiness.category || inspectedBusiness.categoryRel?.name || 'Comercio General'}
                    </span>
                    <span>•</span>
                    <span>ID #{inspectedBusiness.id}</span>
                    {inspectedBusiness.createdAt && (
                      <>
                        <span>•</span>
                        <span>Postulado: {format(new Date(inspectedBusiness.createdAt), "d 'de' MMMM, yyyy", { locale: es })}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedBusiness(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                title="Cerrar ficha"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo del Dossier Scrollable */}
            <div style={{ overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px', margin: '14px 0', flex: 1 }}>
              {/* Alerta de Observación si fue rechazado */}
              {inspectedBusiness.status === 'rejected' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#991b1b', fontSize: '0.88rem', display: 'block' }}>
                      Motivo de la Observación Registrada por Administración:
                    </strong>
                    <p style={{ margin: '4px 0 0', color: '#b91c1c', fontSize: '0.84rem', lineHeight: '1.4' }}>
                      {inspectedBusiness.rejectionReason || 'No se detallaron observaciones específicas.'}
                    </p>
                  </div>
                </div>
              )}

              {/* 1. Identidad & Descripción */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={14} color="#0284c7" /> Descripción y Datos del Negocio
                </h4>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-title)', lineHeight: '1.5', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
                  {inspectedBusiness.description || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin descripción comercial ingresada.</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Email Comercial</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-title)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      {inspectedBusiness.email ? (
                        <a href={`mailto:${inspectedBusiness.email}`} style={{ color: '#0284c7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={13} /> {inspectedBusiness.email}
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>No especificado</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Categoría Registrada</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-title)', marginTop: '2px', display: 'block' }}>
                      {inspectedBusiness.category || inspectedBusiness.categoryRel?.name || 'General'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                      Fecha de Creación del Negocio
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-title)' }}>
                        {inspectedBusiness.createdAt
                          ? format(new Date(inspectedBusiness.createdAt), "d 'de' MMMM, yyyy · HH:mm 'hs'", { locale: es })
                          : 'Sin registro'}
                      </span>
                      {inspectedBusiness.createdAt && (Date.now() - new Date(inspectedBusiness.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 ? (
                        <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.7rem', fontWeight: 800, padding: '1px 6px', borderRadius: '8px' }}>
                          🆕 Nuevo (&lt; 7 días)
                        </span>
                      ) : (
                        <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '8px' }}>
                          Establecido
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                      Última Revisión Administrativa
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-title)', marginTop: '2px', display: 'block' }}>
                      {inspectedBusiness.reviewedAt
                        ? format(new Date(inspectedBusiness.reviewedAt), "dd/MM/yyyy · HH:mm 'hs'", { locale: es })
                        : 'Pendiente de primera revisión'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Ubicación Física & Contacto */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#0284c7" /> Ubicación y Canales de Contacto
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Dirección Física</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-title)', marginTop: '2px', display: 'block' }}>
                      {inspectedBusiness.address || 'Sin dirección registrada'}
                    </span>
                    {(inspectedBusiness.city || inspectedBusiness.province) && (
                      <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                        {[inspectedBusiness.city, inspectedBusiness.province].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Teléfono del Negocio</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-title)', marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {inspectedBusiness.phone ? (
                        <>
                          <Phone size={13} color="#0284c7" /> {inspectedBusiness.phone}
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Sin teléfono registrado</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Evidencias de Veracidad & Legal */}
              <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 4px rgba(2,132,199,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#0284c7" /> Evidencias de Veracidad y Auditoría
                  </h4>
                  <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Auditoría de Redes y CUIT
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                  {/* Instagram */}
                  <div style={{ border: '1px solid #fecdd3', background: '#fff1f2', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 800, color: '#e1306c' }}>
                        <InstagramIcon size={14} color="#e1306c" /> Instagram
                      </span>
                      {inspectedBusiness.instagramUrl && (
                        <a href={inspectedBusiness.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.74rem', color: '#e1306c', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          Abrir <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#881337', fontWeight: 600, wordBreak: 'break-all' }}>
                      {inspectedBusiness.instagramUrl || <span style={{ color: '#fda4af', fontStyle: 'italic' }}>No adjuntado</span>}
                    </div>
                  </div>

                  {/* Facebook */}
                  <div style={{ border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 800, color: '#1877f2' }}>
                        <FacebookIcon size={14} color="#1877f2" /> Facebook
                      </span>
                      {inspectedBusiness.facebookUrl && (
                        <a href={inspectedBusiness.facebookUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.74rem', color: '#1877f2', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          Abrir <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 600, wordBreak: 'break-all' }}>
                      {inspectedBusiness.facebookUrl || <span style={{ color: '#93c5fd', fontStyle: 'italic' }}>No adjuntado</span>}
                    </div>
                  </div>

                  {/* Google Maps */}
                  <div style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 800, color: '#dc2626' }}>
                        <MapPin size={14} color="#dc2626" /> Google Maps
                      </span>
                      {inspectedBusiness.googleMapsUrl && (
                        <a href={inspectedBusiness.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          Abrir <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#7f1d1d', fontWeight: 600, wordBreak: 'break-all' }}>
                      {inspectedBusiness.googleMapsUrl || <span style={{ color: '#fca5a5', fontStyle: 'italic' }}>No adjuntado</span>}
                    </div>
                  </div>

                  {/* Sitio Web */}
                  <div style={{ border: '1px solid #bae6fd', background: '#f0f9ff', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 800, color: '#0284c7' }}>
                        <Globe size={14} color="#0284c7" /> Sitio Web Oficial
                      </span>
                      {inspectedBusiness.websiteUrl && (
                        <a href={inspectedBusiness.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          Abrir <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#0c4a6e', fontWeight: 600, wordBreak: 'break-all' }}>
                      {inspectedBusiness.websiteUrl || <span style={{ color: '#7dd3fc', fontStyle: 'italic' }}>No adjuntado</span>}
                    </div>
                  </div>

                  {/* CUIT */}
                  <div style={{ border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>
                        <FileText size={14} color="#475569" /> CUIT Tributario
                      </span>
                      {inspectedBusiness.cuit && (
                        <button
                          type="button"
                          onClick={() => handleCopyCuit(inspectedBusiness.cuit)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.74rem', color: '#0284c7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', padding: 0 }}
                          title="Copiar CUIT al portapapeles"
                        >
                          {copiedCuit ? <CheckCheck size={12} color="#16a34a" /> : <Copy size={12} />}
                          {copiedCuit ? '¡Copiado!' : 'Copiar'}
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>
                      {inspectedBusiness.cuit || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontFamily: 'inherit' }}>No declarado</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Titular / Solicitante de la cuenta */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} color="#0284c7" /> Usuario Solicitante y Dueño
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(inspectedBusiness.owner?.name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-title)' }}>
                        {inspectedBusiness.owner?.name || 'Sin dueño asignado'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        {inspectedBusiness.owner?.email || 'Sin correo registrado'}
                        {inspectedBusiness.owner?.createdAt && (
                          <span style={{ marginLeft: '6px', color: '#475569', fontWeight: 600 }}>
                            · Cuenta creada el {format(new Date(inspectedBusiness.owner.createdAt), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {inspectedBusiness.phone && (
                    <a
                      href={`https://wa.me/${inspectedBusiness.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(inspectedBusiness.owner?.name || '')},%20te%20escribimos%20de%20Turnos%20Ya%20respecto%20a%20tu%20solicitud%20para%20${encodeURIComponent(inspectedBusiness.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm"
                      style={{ background: '#16a34a', color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px' }}
                    >
                      <MessageCircle size={14} /> Chatear por WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* 5. Servicios Ofrecidos */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Servicios Ofrecidos ({inspectedBusiness.services?.length || 0})
                </h4>
                {(!inspectedBusiness.services || inspectedBusiness.services.length === 0) ? (
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    El comercio no tiene servicios cargados todavía.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    {inspectedBusiness.services.map((s: any) => (
                      <div key={s.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.84rem', color: 'var(--text-title)', display: 'block' }}>{s.name}</strong>
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>⏱ {s.durationMinutes} min</span>
                        </div>
                        <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.88rem' }}>${s.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pie del Modal con Acciones de Moderación */}
            <div className="modal-footer-responsive" style={{ margin: 0, paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', flexShrink: 0 }}>
              <button type="button" className="btn btn-light" onClick={() => setInspectedBusiness(null)}>
                Cerrar Ficha
              </button>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {inspectedBusiness.status === 'pending_approval' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        const b = inspectedBusiness;
                        setInspectedBusiness(null);
                        setBusinessToReject(b);
                        setRejectionReasonInput('');
                      }}
                      style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 14px', fontSize: '0.84rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
                    >
                      ✕ Observar Solicitud
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        const b = inspectedBusiness;
                        setInspectedBusiness(null);
                        setBusinessToApprove(b);
                      }}
                      style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.84rem', fontWeight: 700, borderRadius: '8px', boxShadow: '0 2px 4px rgba(16,185,129,0.3)', cursor: 'pointer' }}
                    >
                      ✓ Aprobar Comercio
                    </button>
                  </>
                )}

                {inspectedBusiness.status === 'approved' && (
                  <>
                    <a
                      href={`/businesses/${inspectedBusiness.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ fontSize: '0.84rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ExternalLink size={14} /> Ver en sitio público
                    </a>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        const b = inspectedBusiness;
                        setInspectedBusiness(null);
                        setEmergencyCancelBiz(b);
                        setEmergencyCancelDate(new Date().toISOString().split('T')[0]);
                        setEmergencyCancelReason('');
                      }}
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 14px', fontSize: '0.84rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      title="Cancelar turnos por fuerza mayor con aviso automático a clientes"
                    >
                      <AlertTriangle size={14} /> Cancelar por Emergencia
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        const b = inspectedBusiness;
                        setInspectedBusiness(null);
                        setBusinessToSuspend(b);
                        setSuspendReasonInput('');
                      }}
                      style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '8px 14px', fontSize: '0.84rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
                    >
                      ⏸ Suspender Comercio
                    </button>
                  </>
                )}

                {inspectedBusiness.status === 'suspended' && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      const b = inspectedBusiness;
                      setInspectedBusiness(null);
                      setBusinessToReactivate(b);
                    }}
                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.84rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
                  >
                    ▶ Reactivar Comercio
                  </button>
                )}

                {inspectedBusiness.status === 'rejected' && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      const b = inspectedBusiness;
                      setInspectedBusiness(null);
                      setBusinessToApprove(b);
                    }}
                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.84rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
                  >
                    ✓ Reconsiderar y Aprobar
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    const b = inspectedBusiness;
                    setInspectedBusiness(null);
                    setBusinessToDelete(b);
                    setDeleteBizReasonInput('');
                    setDeleteBizAlsoOwner(false);
                  }}
                  style={{
                    background: '#991b1b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 14px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Elimina el negocio de la base de datos operativa y guarda registro forense en Auditoría"
                >
                  <Trash2 size={14} /> Rechazar y Eliminar (Fraude/Baja)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 3: FICHA RÁPIDA DE TURNO */}
      {/* ======================================================================= */}
      {inspectedAppointment && (
        <div className="modal-overlay" onClick={() => setInspectedAppointment(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '100%' }}>
            <div className="modal-drag-handle" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Turno #{inspectedAppointment.id}
                  </h3>
                  <span
                    className={`badge ${
                      inspectedAppointment.status === 'CONFIRMED'
                        ? 'badge-confirmed'
                        : inspectedAppointment.status === 'COMPLETED'
                        ? 'badge-completed'
                        : inspectedAppointment.status === 'CANCELLED'
                        ? 'badge-cancelled'
                        : 'badge-pending'
                    }`}
                    style={{ fontSize: '0.72rem', marginTop: '2px' }}
                  >
                    {inspectedAppointment.status}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedAppointment(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, display: 'block' }}>CLIENTE</span>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-title)' }}>
                  {inspectedAppointment.user?.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {inspectedAppointment.user?.email}
                  {inspectedAppointment.user?.phone ? ` · Tel: ${inspectedAppointment.user.phone}` : ''}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, display: 'block' }}>COMERCIO Y SERVICIO</span>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0284c7' }}>
                  {inspectedAppointment.business?.name}
                </div>
                <div style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 600 }}>
                  {inspectedAppointment.service?.name} {inspectedAppointment.service?.price ? `· $${inspectedAppointment.service.price}` : ''}
                </div>
                {inspectedAppointment.business?.address && (
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    📍 {inspectedAppointment.business.address}
                  </div>
                )}
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, display: 'block' }}>FECHA Y HORARIO</span>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-title)' }}>
                  {(() => {
                    try {
                      return `${format(new Date(inspectedAppointment.date), 'EEEE d MMMM yyyy', { locale: es })} a las ${formatTimeToHHMM(inspectedAppointment.time)} hs`;
                    } catch {
                      return '—';
                    }
                  })()}
                </div>
              </div>

              {(inspectedAppointment.status === 'CONFIRMED' || inspectedAppointment.status === 'PENDING') && (
                <div style={{ background: '#fef2f2', padding: '12px 14px', borderRadius: '10px', border: '1px solid #fecaca', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.76rem', color: '#991b1b', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                    INTERVENCIÓN DE SOPORTE: CANCELAR TURNO INDIVIDUAL
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Motivo de cancelación (se enviará al cliente y comercio)..."
                    value={adminAptCancelReason}
                    onChange={(e) => setAdminAptCancelReason(e.target.value)}
                    style={{ fontSize: '0.84rem', marginBottom: '8px', background: '#ffffff' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    disabled={cancellingAptId === inspectedAppointment.id}
                    onClick={async () => {
                      const reason = adminAptCancelReason.trim() || 'Cancelado por intervención de soporte administrativo';
                      setCancellingAptId(inspectedAppointment.id);
                      try {
                        await api.patch(`/appointments/${inspectedAppointment.id}/cancel`, { reason });
                        setAppointments((prev) =>
                          prev.map((a) => (a.id === inspectedAppointment.id ? { ...a, status: 'CANCELLED' } : a))
                        );
                        setInspectedAppointment(null);
                        setAdminAptCancelReason('');
                        showToast(`✓ Turno #${inspectedAppointment.id} cancelado y notificado`);
                      } catch (err: any) {
                        showToast(err?.response?.data?.message || 'No se pudo cancelar el turno');
                      } finally {
                        setCancellingAptId(null);
                      }
                    }}
                    style={{ width: '100%', fontWeight: 700, background: '#dc2626', borderColor: '#dc2626' }}
                  >
                    {cancellingAptId === inspectedAppointment.id ? 'Cancelando...' : 'Cancelar Turno y Notificar'}
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer-responsive" style={{ margin: 0 }}>
              <button
                type="button"
                className="btn btn-light"
                onClick={() => {
                  setInspectedAppointment(null);
                  setAdminAptCancelReason('');
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 4: DETALLE Y RESOLUCIÓN DE REPORTE TÉCNICO */}
      {/* ======================================================================= */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '100%' }}>
            <div className="modal-drag-handle" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background:
                      selectedReport.section === 'SOLICITUD_RUBRO'
                        ? '#eff6ff'
                        : selectedReport.section === 'MODERACION_RESENA'
                        ? '#fee2e2'
                        : '#fef2f2',
                    color:
                      selectedReport.section === 'SOLICITUD_RUBRO'
                        ? '#2563eb'
                        : selectedReport.section === 'MODERACION_RESENA'
                        ? '#dc2626'
                        : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedReport.section === 'SOLICITUD_RUBRO' ? (
                    <Tags size={20} />
                  ) : selectedReport.section === 'MODERACION_RESENA' ? (
                    <Flag size={20} />
                  ) : (
                    <Bug size={20} />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    {selectedReport.section === 'SOLICITUD_RUBRO'
                      ? 'Solicitud de Nuevo Rubro Comercial'
                      : selectedReport.section === 'MODERACION_RESENA'
                      ? 'Reclamo y Moderación de Opinión'
                      : `Ticket #${selectedReport.id}: ${selectedReport.section}`}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Reportado por {selectedReport.user?.name} ({selectedReport.user?.email}) · {format(new Date(selectedReport.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Acciones Especiales para Solicitud de Rubro */}
              {selectedReport.section === 'SOLICITUD_RUBRO' && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong style={{ color: '#1e40af', fontSize: '0.88rem', display: 'block' }}>Solicitud de Nuevo Rubro</strong>
                    <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>Puedes crear este rubro en el catálogo y resolver el ticket en un solo paso.</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const reqName = selectedReport.summary.replace(/Solicitud de nuevo rubro:\s*/i, '').trim();
                      handleOpenCategoryModal();
                      setCategoryForm((prev) => ({
                        ...prev,
                        name: reqName,
                        slug: reqName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                        description: selectedReport.steps || '',
                      }));
                      handleReportStatusChange(selectedReport.id, 'RESOLVED', 'Rubro aprobado y creado en el sistema');
                      setSelectedReport(null);
                    }}
                    style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> Aprobar y Crear Rubro
                  </button>
                </div>
              )}

              {/* Acciones Especiales para Moderación de Reseña */}
              {selectedReport.section === 'MODERACION_RESENA' && (() => {
                const match = selectedReport.summary.match(/ID #(\d+)/) || selectedReport.steps?.match(/ID #(\d+)/);
                const revId = match ? Number(match[1]) : null;
                return (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', marginBottom: '1.25rem' }}>
                    <strong style={{ color: '#991b1b', fontSize: '0.88rem', display: 'block', marginBottom: '4px' }}>
                      Acciones de Moderación Inmediata
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: '#b91c1c', display: 'block', marginBottom: '10px' }}>
                      Puedes ocultar la reseña para que deje de ser pública o eliminarla definitivamente:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedReport.pageUrl && (
                        <a
                          href={selectedReport.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-light"
                          style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <ExternalLink size={12} /> Ver en el comercio
                        </a>
                      )}
                      {revId && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-light"
                            onClick={async () => {
                              try {
                                await api.patch(`/admin/reviews/${revId}/hide`, { reason: 'Ocultada tras reporte #' + selectedReport.id });
                                await handleReportStatusChange(selectedReport.id, 'RESOLVED', 'Reseña ocultada de la vista pública');
                                showToast('✓ Reseña ocultada y ticket resuelto');
                                setSelectedReport(null);
                              } catch {
                                showToast('Error al ocultar reseña');
                              }
                            }}
                            style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ea580c', background: '#fff7ed', borderColor: '#fed7aa' }}
                          >
                            <EyeOff size={12} /> Ocultar Reseña
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={async () => {
                              try {
                                await api.delete(`/admin/reviews/${revId}`);
                                await handleReportStatusChange(selectedReport.id, 'RESOLVED', 'Reseña eliminada permanentemente');
                                showToast('✓ Reseña eliminada y ticket resuelto');
                                setSelectedReport(null);
                              } catch {
                                showToast('Error al eliminar reseña');
                              }
                            }}
                            style={{ fontSize: '0.78rem', fontWeight: 700, background: '#dc2626', borderColor: '#dc2626' }}
                          >
                            <Trash2 size={12} /> Eliminar Reseña
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div style={{ marginBottom: '1rem' }}>
                <label className="text-muted text-xs" style={{ fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                  RESUMEN
                </label>
                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-title)' }}>
                  {selectedReport.summary}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="text-muted text-xs" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  DETALLES DEL REPORTE
                </label>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '0.86rem',
                    lineHeight: 1.5,
                    color: '#334155',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedReport.steps}
                </div>
              </div>

              {selectedReport.pageUrl && (
                <div style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                  <strong style={{ color: '#475569' }}>URL donde ocurrió: </strong>
                  <a href={selectedReport.pageUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7' }}>
                    {selectedReport.pageUrl}
                  </a>
                </div>
              )}

              {selectedReport.deviceInfo && (
                <div style={{ marginBottom: '1.25rem', fontSize: '0.78rem', color: '#64748b' }}>
                  <strong>Navegador / Dispositivo: </strong> {selectedReport.deviceInfo}
                </div>
              )}

              {/* Notas del equipo técnico */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="text-muted text-xs" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Notas internas del equipo técnico
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Escribí notas sobre la causa, solución o seguimiento del bug..."
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  style={{ fontSize: '0.86rem', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={() => handleReportStatusChange(selectedReport.id, 'IN_REVIEW', adminNotesInput)}
                  disabled={savingReportId === selectedReport.id}
                  style={{ fontSize: '0.8rem' }}
                >
                  Poner en revisión
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={() => handleReportStatusChange(selectedReport.id, 'RESOLVED', adminNotesInput)}
                  disabled={savingReportId === selectedReport.id}
                  style={{ fontSize: '0.8rem', color: '#059669' }}
                >
                  <Check size={14} /> Marcar Resuelto
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleReportStatusChange(selectedReport.id, selectedReport.status, adminNotesInput);
                  setSelectedReport(null);
                }}
                disabled={savingReportId === selectedReport.id}
                style={{ fontSize: '0.85rem' }}
              >
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 5: CONFIRMACIÓN SEGURA DE ELIMINACIÓN DE USUARIO */}
      {/* ======================================================================= */}
      {userToDelete && (
        <div className="modal-overlay" onClick={() => setUserToDelete(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <AlertTriangle size={26} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                ¿Eliminar usuario?
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                Estás por eliminar a <strong>{userToDelete.name}</strong>. Esta acción dará de baja su cuenta y no podrá iniciar sesión en la plataforma.
              </p>
            </div>

            <div className="modal-footer-responsive" style={{ justifyContent: 'center', gap: '10px' }}>
              <button type="button" className="btn btn-light" onClick={() => setUserToDelete(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmDeleteUser}
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
              >
                Sí, eliminar usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 6: MONITOR Y GESTIÓN DE CACHÉ INTELIGENTE */}
      {/* ======================================================================= */}
      {showCacheModal && (
        <div className="modal-overlay" onClick={() => setShowCacheModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Zap size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Caché Inteligente del Sistema
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Arquitectura Multi-Tier: Backend LRU + Cliente Web
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCacheModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                }}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 0' }}>
              {/* Grid de Métricas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Motor Activo
                  </span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {cacheStats?.engine || 'in-memory (LRU + TTL)'}
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Tasa de Acierto (Hit Ratio)
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                    {cacheStats?.hitRatio || '100%'}
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Claves Backend
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {cacheStats?.totalKeys ?? 0} <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>activas</span>
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Aciertos / Fallos
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    <span style={{ color: '#059669' }}>{cacheStats?.hits ?? 0} hits</span> /{' '}
                    <span style={{ color: '#94a3b8' }}>{cacheStats?.misses ?? 0} misses</span>
                  </div>
                </div>
              </div>

              {/* Info del Cliente Web */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  color: '#166534',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Sparkles size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Caché en Navegador:</strong> {clientCache.getStats().size} consultas en memoria local (0ms de latencia). Se invalidan automáticamente ante cualquier reserva o modificación.
                </span>
              </div>
            </div>

            <div className="modal-footer-responsive">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setShowCacheModal(false)}
                style={{ fontSize: '0.85rem' }}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClearCache}
                disabled={clearingCache}
                style={{
                  background: '#ea580c',
                  borderColor: '#ea580c',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 size={14} />
                <span>{clearingCache ? 'Purgando...' : 'Purgar Toda la Caché'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Aprobación de Comercio */}
      {businessToApprove && (
        <div className="modal-overlay admin-modal-overlay" onClick={() => !processingBizAction && setBusinessToApprove(null)}>
          <div className="modal-box admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-title)' }}>
                    Confirmar Alta y Aprobación
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Revisión de veracidad completada</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBusinessToApprove(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-title)', marginBottom: '4px' }}>
                {businessToApprove.name}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '8px' }}>
                Rubro: <strong>{businessToApprove.category || businessToApprove.categoryRel?.name}</strong> • Dirección: <strong>{businessToApprove.address}</strong>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Dueño: <strong>{businessToApprove.owner?.name}</strong> ({businessToApprove.owner?.email})
              </div>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Al aprobar este comercio, el negocio se publicará inmediatamente en el catálogo público de Turnos Ya, su dueño obtendrá rol de comerciante (owner) y se le enviará un correo electrónico de confirmación.
            </p>

            <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-light"
                disabled={processingBizAction}
                onClick={() => setBusinessToApprove(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-success"
                disabled={processingBizAction}
                onClick={handleApproveBusiness}
                style={{ background: '#10b981', color: 'white', border: 'none', fontWeight: 800, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
              >
                {processingBizAction ? 'Aprobando...' : '✓ Confirmar Alta y Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rechazo / Observación de Comercio */}
      {businessToReject && (
        <div className="modal-overlay admin-modal-overlay" onClick={() => !processingBizAction && setBusinessToReject(null)}>
          <div className="modal-box admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: '#991b1b' }}>
                    Observar Solicitud de Negocio
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{businessToReject.name}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBusinessToReject(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-title)' }}>
                Motivo de la observación <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Describe claramente por qué se observa la solicitud (ej. 'El link de Instagram no coincide con el local declarado', 'Dirección incompleta, falta número de local')..."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                autoFocus
              />
              <span className="text-muted text-xs" style={{ display: 'block', marginTop: '6px' }}>
                Este mensaje se enviará por notificación y correo al dueño para que pueda corregir los datos y reenviar la solicitud.
              </span>
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  background: '#fef2f2',
                  border: '1px dashed #fca5a5',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}
              >
                <span style={{ fontSize: '0.78rem', color: '#991b1b', fontWeight: 600 }}>
                  ¿Detectaste que el comercio es un fraude o spam?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const b = businessToReject;
                    const draftReason = rejectionReasonInput;
                    setBusinessToReject(null);
                    setBusinessToDelete(b);
                    setDeleteBizReasonInput(draftReason);
                    setDeleteBizAlsoOwner(false);
                  }}
                  style={{
                    background: '#991b1b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash2 size={12} /> Eliminar Definitivamente
                </button>
              </div>
            </div>

            <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-light"
                disabled={processingBizAction}
                onClick={() => setBusinessToReject(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={processingBizAction || rejectionReasonInput.trim().length < 5}
                onClick={handleRejectBusiness}
                style={{ fontWeight: 800, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
              >
                {processingBizAction ? 'Enviando...' : '✕ Confirmar Observación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Suspensión de Comercio */}
      {businessToSuspend && (
        <div className="modal-overlay admin-modal-overlay" onClick={() => !processingBizAction && setBusinessToSuspend(null)}>
          <div className="modal-box admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: '#c2410c' }}>
                    Suspender Comercio
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{businessToSuspend.name}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBusinessToSuspend(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.5 }}>
              Al suspender este comercio, <strong>dejará de figurar en el catálogo público</strong> y no podrá recibir nuevas reservas de turnos. Se notificará inmediatamente al dueño por correo electrónico e in-app.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-title)' }}>
                Motivo formal de la suspensión <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Describe claramente el motivo (ej. 'Denuncias reiteradas de inasistencia del local', 'Irregularidades en documentación comercial')..."
                value={suspendReasonInput}
                onChange={(e) => setSuspendReasonInput(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-light"
                disabled={processingBizAction}
                onClick={() => setBusinessToSuspend(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={processingBizAction || suspendReasonInput.trim().length < 5}
                onClick={handleSuspendBusiness}
                style={{ background: '#ea580c', borderColor: '#ea580c', fontWeight: 800, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
              >
                {processingBizAction ? 'Suspendiendo...' : '⏸ Confirmar Suspensión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reactivación de Comercio */}
      {businessToReactivate && (
        <div className="modal-overlay admin-modal-overlay" onClick={() => !processingBizAction && setBusinessToReactivate(null)}>
          <div className="modal-box admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-drag-handle" />
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircle2 size={26} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                ¿Reactivar este comercio?
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                Estás por levantar la suspensión de <strong>{businessToReactivate.name}</strong>. Volverá a publicarse de forma inmediata en el catálogo y podrá recibir reservas normalmente.
              </p>
            </div>

            <div className="modal-footer-responsive" style={{ justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-light"
                disabled={processingBizAction}
                onClick={() => setBusinessToReactivate(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-success"
                disabled={processingBizAction}
                onClick={handleReactivateBusiness}
                style={{ background: '#10b981', color: 'white', border: 'none', fontWeight: 800, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
              >
                {processingBizAction ? 'Reactivando...' : '▶ Sí, Reactivar Comercio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Baja Definitiva / Rechazo por Fraude (Purga Operativa + Registro Forense) */}
      {businessToDelete && (
        <div className="modal-overlay admin-modal-overlay" onClick={() => !processingBizAction && setBusinessToDelete(null)}>
          <div className="modal-box admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef2f2', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: '#991b1b' }}>
                    Rechazar y Eliminar Definitivamente
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Purga operativa por fraude o baja definitiva con trazabilidad forense
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBusinessToDelete(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Ficha resumen del comercio a eliminar */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', fontSize: '0.84rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-title)', marginBottom: '4px' }}>
                {businessToDelete.name} <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.8rem' }}>(ID #{businessToDelete.id})</span>
              </div>
              <div style={{ color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span>Rubro: <strong>{businessToDelete.category || businessToDelete.categoryRel?.name || 'General'}</strong></span>
                {businessToDelete.cuit && <span>• CUIT: <strong>{businessToDelete.cuit}</strong></span>}
              </div>
              <div style={{ color: '#475569', marginTop: '4px' }}>
                Solicitante: <strong>{businessToDelete.owner?.name || 'Sin nombre'}</strong> ({businessToDelete.owner?.email || 'sin email'})
              </div>
            </div>

            {/* Aviso de Arquitectura Forense */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 12px', marginBottom: '14px', fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.45 }}>
              <strong>🛡️ Trazabilidad Forense Garantizada:</strong> El negocio será eliminado físicamente de la tabla operativa para mantener limpias las métricas e impedir que el usuario vuelva a postularlo, pero todos sus datos y el motivo quedarán grabados de forma inmutable en la pestaña de <strong>Auditoría</strong>.
            </div>

            {/* Motivo + Chips rápidos */}
            <div style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-title)', fontSize: '0.86rem', marginBottom: '6px', display: 'block' }}>
                Motivo de la baja definitiva / fraude <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {[
                  'Fraude: Comercio inexistente o datos apócrifos',
                  'Suplantación de identidad comercial',
                  'Spam / Cuenta de prueba no autorizada',
                  'Incumplimiento grave de términos del servicio'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDeleteBizReasonInput(preset)}
                    style={{
                      background: deleteBizReasonInput === preset ? '#fee2e2' : '#f1f5f9',
                      color: deleteBizReasonInput === preset ? '#991b1b' : '#475569',
                      border: `1px solid ${deleteBizReasonInput === preset ? '#fca5a5' : '#cbd5e1'}`,
                      borderRadius: '14px',
                      padding: '3px 10px',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Especifica el motivo de la eliminación definitiva para el registro de auditoría..."
                value={deleteBizReasonInput}
                onChange={(e) => setDeleteBizReasonInput(e.target.value)}
                autoFocus
              />
            </div>

            {/* Opción de purgar también la cuenta del usuario spammer */}
            {businessToDelete.owner && businessToDelete.owner.role !== 'administrator' && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  background: deleteBizAlsoOwner ? '#fef2f2' : '#f8fafc',
                  border: `1px solid ${deleteBizAlsoOwner ? '#fca5a5' : '#e2e8f0'}`,
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={deleteBizAlsoOwner}
                  onChange={(e) => setDeleteBizAlsoOwner(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#dc2626', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
                  <strong style={{ color: deleteBizAlsoOwner ? '#991b1b' : 'var(--text-title)', display: 'block' }}>
                    Eliminar también la cuenta del usuario solicitante ({businessToDelete.owner.email})
                  </strong>
                  <span style={{ color: '#64748b', fontSize: '0.76rem' }}>
                    Marca esta casilla si detectaste que el usuario es un bot o creó la cuenta únicamente con fines fraudulentos.
                  </span>
                </div>
              </label>
            )}

            <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-light"
                disabled={processingBizAction}
                onClick={() => setBusinessToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={processingBizAction || deleteBizReasonInput.trim().length < 5}
                onClick={handleDeleteBusinessByAdmin}
                style={{ background: '#991b1b', borderColor: '#991b1b', fontWeight: 800, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={15} />
                <span>
                  {processingBizAction
                    ? 'Eliminando...'
                    : deleteBizAlsoOwner
                    ? 'Eliminar Comercio y Usuario'
                    : 'Rechazar y Eliminar Comercio'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear / Editar Categoría */}
      {categoryModalOpen && (
        <div className="modal-overlay admin-modal-overlay" onClick={() => !savingCategory && setCategoryModalOpen(false)}>
          <div className="modal-box admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tags size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría Comercial'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {editingCategory ? `ID #${editingCategory.id}` : 'Alta en el catálogo de rubros'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Ícono</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="🏢"
                    maxLength={10}
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    style={{ textAlign: 'center', fontSize: '1.3rem', height: '42px', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Nombre *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Ej: Barbería, Estética, Odontología..."
                    value={categoryForm.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const autoSlug = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setCategoryForm({
                        ...categoryForm,
                        name: val,
                        slug: (!editingCategory || !categoryForm.slug) ? autoSlug : categoryForm.slug,
                      });
                    }}
                    style={{ height: '42px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Slug (URL amigable)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ej: barberia"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  style={{ height: '40px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.84rem' }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Descripción comercial
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Breve reseña sobre los servicios que agrupa esta categoría..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  style={{ borderRadius: '8px', fontSize: '0.84rem' }}
                />
              </div>

              <div className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="catIsActiveCheck"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="catIsActiveCheck" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-title)', cursor: 'pointer' }}>
                  Categoría activa (visible para registro y exploración)
                </label>
              </div>

              <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={savingCategory}
                  onClick={() => setCategoryModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingCategory || !categoryForm.name.trim()}
                  style={{ fontWeight: 700, padding: '10px 20px', borderRadius: '8px' }}
                >
                  {savingCategory ? 'Guardando...' : editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar Categoría */}
      {categoryToDelete && (
        <div className="modal-overlay admin-modal-overlay" onClick={() => !deletingCategory && setCategoryToDelete(null)}>
          <div className="modal-box admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center', padding: '1.5rem' }}>
            <div className="modal-drag-handle" />
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
              ¿Eliminar Categoría?
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
              ¿Estás seguro de eliminar la categoría <strong>{categoryToDelete.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="modal-footer-responsive" style={{ justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-light"
                disabled={deletingCategory}
                onClick={() => setCategoryToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deletingCategory}
                onClick={handleDeleteCategory}
                style={{ background: '#dc2626', borderColor: '#dc2626', fontWeight: 800, padding: '10px 20px', borderRadius: '8px' }}
              >
                {deletingCategory ? 'Eliminando...' : '🗑 Eliminar Categoría'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear Comunicado / Aviso */}
      {announcementModalOpen && (
        <div className="modal-overlay admin-modal-overlay" onClick={() => !savingAnnouncement && setAnnouncementModalOpen(false)}>
          <div className="modal-box admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Megaphone size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Nuevo Comunicado Oficial
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Banner de aviso global en la cabecera
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnnouncementModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement}>
              {/* Selector de Tipo */}
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  Nivel de Alerta / Tipo de Banner *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { type: 'info' as const, label: 'Informativo', color: '#2563eb', bg: '#eff6ff' },
                    { type: 'warning' as const, label: 'Mantenimiento', color: '#d97706', bg: '#fffbeb' },
                    { type: 'danger' as const, label: 'Urgente', color: '#dc2626', bg: '#fef2f2' },
                    { type: 'success' as const, label: 'Novedad', color: '#059669', bg: '#ecfdf5' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setAnnouncementForm({ ...announcementForm, type: item.type })}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '8px',
                        border: announcementForm.type === item.type ? `2px solid ${item.color}` : '1px solid #e2e8f0',
                        background: announcementForm.type === item.type ? item.bg : '#ffffff',
                        color: announcementForm.type === item.type ? item.color : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mensaje */}
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  Mensaje del Aviso *
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  required
                  placeholder="Ej: Mantenimiento programado: el servicio no estará disponible este domingo de 03:00 a 05:00 hs."
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  style={{ borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              {/* Enlace opcional */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                    Texto del Enlace (opcional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Más información"
                    value={announcementForm.linkText}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, linkText: e.target.value })}
                    style={{ height: '40px', borderRadius: '8px', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                    URL destino (opcional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://... o /ruta"
                    value={announcementForm.linkUrl}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, linkUrl: e.target.value })}
                    style={{ height: '40px', borderRadius: '8px', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Fecha de expiración */}
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Fecha y hora de expiración automática (opcional)
                </label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={announcementForm.expiresAt}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, expiresAt: e.target.value })}
                  style={{ height: '40px', borderRadius: '8px', fontSize: '0.84rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Si se deja en blanco, el aviso se mantendrá activo de forma permanente hasta que se pause.
                </span>
              </div>

              {/* Live Preview del Banner */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                  Vista previa en vivo del banner
                </span>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: {
                      info: '#eff6ff',
                      warning: '#fffbeb',
                      danger: '#fef2f2',
                      success: '#ecfdf5',
                    }[announcementForm.type],
                    color: {
                      info: '#1e40af',
                      warning: '#92400e',
                      danger: '#991b1b',
                      success: '#065f46',
                    }[announcementForm.type],
                    border: `1px solid ${{
                      info: '#bfdbfe',
                      warning: '#fde68a',
                      danger: '#fecaca',
                      success: '#a7f3d0',
                    }[announcementForm.type]}`,
                  }}
                >
                  <Info size={16} />
                  <span style={{ flex: 1 }}>{announcementForm.message || 'Escribe un mensaje para previsualizar...'}</span>
                  {announcementForm.linkText && (
                    <span style={{ textDecoration: 'underline', fontWeight: 700 }}>
                      {announcementForm.linkText} →
                    </span>
                  )}
                </div>
              </div>

              <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={savingAnnouncement}
                  onClick={() => setAnnouncementModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingAnnouncement || !announcementForm.message.trim()}
                  style={{ fontWeight: 700, padding: '10px 20px', borderRadius: '8px' }}
                >
                  {savingAnnouncement ? 'Publicando...' : 'Publicar Comunicado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar Comunicado */}
      {announcementToDelete && (
        <div className="modal-overlay admin-modal-overlay" onClick={() => !deletingAnnouncement && setAnnouncementToDelete(null)}>
          <div className="modal-box admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center', padding: '1.5rem' }}>
            <div className="modal-drag-handle" />
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
              ¿Eliminar Comunicado?
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
              ¿Deseas eliminar este aviso permanentemente del historial de banners?
            </p>
            <div className="modal-footer-responsive" style={{ justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-light"
                disabled={deletingAnnouncement}
                onClick={() => setAnnouncementToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deletingAnnouncement}
                onClick={handleDeleteAnnouncement}
                style={{ background: '#dc2626', borderColor: '#dc2626', fontWeight: 800, padding: '10px 20px', borderRadius: '8px' }}
              >
                {deletingAnnouncement ? 'Eliminando...' : '🗑 Eliminar Aviso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelación de Emergencia por Fuerza Mayor */}
      {emergencyCancelBiz && (
        <div className="modal-overlay admin-modal-overlay" onClick={() => !processingEmergencyCancel && setEmergencyCancelBiz(null)}>
          <div className="modal-box admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                  Cancelación por Fuerza Mayor
                </h3>
                <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  Comercio: <strong>{emergencyCancelBiz.name}</strong>
                </span>
              </div>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', marginBottom: '1.25rem', fontSize: '0.84rem', color: '#991b1b', lineHeight: 1.45 }}>
              <strong>Advertencia de Seguridad:</strong> Esta acción cancelará todos los turnos confirmados y pendientes para la fecha seleccionada en este negocio. El sistema despachará automáticamente notificaciones por correo y alertas internas a cada cliente y al titular explicando el motivo de la emergencia.
            </div>

            <form onSubmit={handleEmergencyCancel}>
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  Fecha afectada por la contingencia *
                </label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={emergencyCancelDate}
                  onChange={(e) => setEmergencyCancelDate(e.target.value)}
                  style={{ height: '42px', borderRadius: '8px' }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  Motivo de Fuerza Mayor comunicado a los clientes *
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  placeholder="Ej: Corte general imprevisto de suministro eléctrico en la zona comercial / Alerta meteorológica por temporal severo."
                  value={emergencyCancelReason}
                  onChange={(e) => setEmergencyCancelReason(e.target.value)}
                  style={{ borderRadius: '8px', fontSize: '0.88rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Este texto se incluirá en el correo electrónico y notificación que recibirá cada cliente.
                </span>
              </div>

              <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={processingEmergencyCancel}
                  onClick={() => setEmergencyCancelBiz(null)}
                >
                  Cancelar Operación
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={processingEmergencyCancel || !emergencyCancelReason.trim()}
                  style={{ background: '#dc2626', borderColor: '#dc2626', fontWeight: 800, padding: '10px 20px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {processingEmergencyCancel ? 'Procesando cancelación...' : '🚨 Ejecutar Cancelación Masiva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Resultado de Cancelación de Emergencia */}
      {emergencyCancelResult && (
        <div className="modal-overlay admin-modal-overlay" onClick={() => setEmergencyCancelResult(null)}>
          <div className="modal-box admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center', padding: '1.75rem' }}>
            <div className="modal-drag-handle" />
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-title)' }}>
              Operación Completada
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem', color: '#475569' }}>
              {emergencyCancelResult.message}
            </p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              Turnos cancelados: <span style={{ color: '#dc2626', fontSize: '1.1rem' }}>{emergencyCancelResult.cancelledCount}</span>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setEmergencyCancelResult(null)}
              style={{ width: '100%', padding: '10px', fontWeight: 700, borderRadius: '8px' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Log de Auditoría */}
      {selectedAuditLog && (
        <div className="modal-overlay admin-modal-overlay" onClick={() => setSelectedAuditLog(null)}>
          <div className="modal-box admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <History size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Detalle de Evento #{selectedAuditLog.id}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {selectedAuditLog.createdAt ? new Date(selectedAuditLog.createdAt).toLocaleString('es-AR') : '—'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                <strong style={{ color: '#64748b' }}>Administrador:</strong>
                <span>{selectedAuditLog.adminName} (ID #{selectedAuditLog.adminId})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                <strong style={{ color: '#64748b' }}>Acción:</strong>
                <span style={{ fontWeight: 700 }}>{selectedAuditLog.action}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                <strong style={{ color: '#64748b' }}>Entidad afectada:</strong>
                <span>{selectedAuditLog.targetType} {selectedAuditLog.targetId ? `(#${selectedAuditLog.targetId})` : ''}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                <strong style={{ color: '#64748b' }}>IP de Origen:</strong>
                <span style={{ fontFamily: 'monospace' }}>{selectedAuditLog.ipAddress || 'No registrada'}</span>
              </div>
              <div>
                <strong style={{ color: '#64748b', display: 'block', marginBottom: '6px' }}>Detalles / Justificación:</strong>
                <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '0.84rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {selectedAuditLog.details || 'Sin detalles adicionales.'}
                </div>
              </div>
            </div>

            <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setSelectedAuditLog(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAdmin;
