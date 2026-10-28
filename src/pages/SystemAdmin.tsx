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
  Database,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

export const SystemAdmin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Navegación principal de pestañas
  const [activeTab, setActiveTab] = useState<'cockpit' | 'users' | 'businesses' | 'appointments' | 'reports'>('cockpit');

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Bug reports
  const [reports, setReports] = useState<any[]>([]);
  const [reportsCounts, setReportsCounts] = useState({ pending: 0, inReview: 0, resolved: 0, discarded: 0, total: 0 });
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsStatusFilter, setReportsStatusFilter] = useState<string>('ALL');

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
      if (activeTab === 'users' || activeTab === 'cockpit') {
        const res = await api.get('/admin/users');
        setUsers(res.data.data ?? []);
      }
      if (activeTab === 'businesses' || activeTab === 'cockpit') {
        const res = await api.get('/businesses?limit=150');
        setBusinesses(res.data.data ?? []);
      }
      if (activeTab === 'appointments' || activeTab === 'cockpit') {
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
    } catch (err) {
      console.error('Error al cargar datos de pestaña', err);
    } finally {
      setLoadingTab(false);
    }
  };

  useEffect(() => {
    fetchTabData();
  }, [activeTab, reportsPage, reportsStatusFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStatsAndReports(), fetchTabData()]);
    setRefreshing(false);
    showToast('✓ Datos del sistema actualizados');
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

  // Filtrado reactivo de Comercios
  const filteredBusinesses = businesses.filter((b) => {
    const cat = b.category || (b as any).categoryRel?.name || '';
    const matchesSearch =
      (b.name || '').toLowerCase().includes(bizSearch.toLowerCase()) ||
      (b.address || '').toLowerCase().includes(bizSearch.toLowerCase()) ||
      (b.owner?.name || '').toLowerCase().includes(bizSearch.toLowerCase()) ||
      (b.owner?.email || '').toLowerCase().includes(bizSearch.toLowerCase());
    const matchesCategory = bizCategoryFilter === 'ALL' || cat === bizCategoryFilter;
    return matchesSearch && matchesCategory;
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
            onClick={() => {
              loadCacheStats();
              setShowCacheModal(true);
            }}
            style={{
              fontSize: '0.84rem',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#0284c7',
              fontWeight: 600,
            }}
            title="Monitoreo de Caché Inteligente"
          >
            <Zap size={14} color="#0284c7" />
            <span>Caché: {cacheStats ? cacheStats.hitRatio : 'Activa'}</span>
          </button>

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
            onClick={() => navigate('/')}
            style={{ fontSize: '0.84rem', padding: '8px 16px' }}
          >
            ← Volver al sitio
          </button>
        </div>
      </div>

      {/* Segmented Navigation Tabs estilo Mercado Libre */}
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
          className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          <span>Usuarios</span>
          <span className="admin-nav-badge">{stats.totalUsers}</span>
        </button>

        <button
          type="button"
          className={`admin-nav-item ${activeTab === 'businesses' ? 'active' : ''}`}
          onClick={() => setActiveTab('businesses')}
        >
          <Building2 size={16} />
          <span>Comercios</span>
          <span className="admin-nav-badge">{stats.totalBusinesses}</span>
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
          className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <Bug size={16} />
          <span>Reportes y Soporte</span>
          <span className={`admin-nav-badge ${reportsCounts.pending > 0 ? 'danger' : ''}`}>
            {reportsCounts.pending > 0 ? reportsCounts.pending : reportsCounts.total}
          </span>
        </button>
      </nav>

      {/* ======================================================================= */}
      {/* PESTAÑA 1: CENTRO DE CONTROL EJECUTIVO (COCKPIT) */}
      {/* ======================================================================= */}
      {activeTab === 'cockpit' && (
        <div>
          {/* Bandeja de Atención Inmediata (Action Center) */}
          {reportsCounts.pending > 0 ? (
            <div className="admin-alert-cockpit alert-has-pending">
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
                    Atención Inmediata: {reportsCounts.pending} {reportsCounts.pending === 1 ? 'ticket de error pendiente' : 'tickets de error pendientes'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#b91c1c' }}>
                    Los usuarios han reportado inconvenientes técnicos que requieren revisión del equipo de soporte.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('reports')}
                style={{ fontSize: '0.84rem', padding: '8px 16px', background: '#dc2626', borderColor: '#dc2626' }}
              >
                Revisar tickets pendientes <ArrowRight size={14} />
              </button>
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
                    Plataforma 100% Operativa y Estable
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#15803d' }}>
                    No hay reportes de errores pendientes de resolución. Los servicios y bases de datos funcionan correctamente.
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                Base de datos TiDB / MySQL en línea
              </span>
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

              {appointments.slice(0, 5).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.86rem' }}>
                  Aún no se han reservado turnos en el sistema.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {appointments.slice(0, 5).map((apt) => (
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

              {users.slice(0, 5).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.86rem' }}>
                  No hay usuarios cargados.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {users.slice(0, 5).map((u) => {
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
                                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-title)' }}>
                                    {u.name}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
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

          {/* Chips de filtro por categoría */}
          <div className="admin-chips-filter-row">
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
              Todas ({businesses.length})
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
                {cat} ({businesses.filter((b) => (b.category || (b as any).categoryRel?.name) === cat).length})
              </button>
            ))}
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
                        Comercio
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Categoría
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Dirección
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Dueño Responsable
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Servicios
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
                        const servicesCount = b.services?.length || 0;

                        return (
                          <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    background: '#e0f2fe',
                                    color: '#0284c7',
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
                                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-title)' }}>
                                    {b.name}
                                  </div>
                                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>ID #{b.id}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span
                                style={{
                                  background: '#f1f5f9',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  padding: '2px 8px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  color: '#334155',
                                }}
                              >
                                {b.category || b.categoryRel?.name || 'General'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#475569' }}>
                              {b.address || <span style={{ color: '#cbd5e1' }}>Sin dirección</span>}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-title)' }}>
                                {b.owner?.name || 'Sin dueño'}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{b.owner?.email}</div>
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '0.84rem' }}>
                              <span style={{ fontWeight: 700, color: '#0284c7' }}>{servicesCount}</span>{' '}
                              <span style={{ color: '#64748b' }}>{servicesCount === 1 ? 'servicio' : 'servicios'}</span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light"
                                  onClick={() => setInspectedBusiness(b)}
                                  style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                                  title="Ver ficha técnica del comercio"
                                >
                                  <Eye size={14} /> Ficha
                                </button>
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
                    {reports.map((report) => (
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

            {/* Datos de contacto */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '1.25rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
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
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-title)' }}>{b.name}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '6px' }}>({b.category})</span>
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
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', width: '100%' }}>
            <div className="modal-drag-handle" />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    fontWeight: 800,
                    fontSize: '1.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {(inspectedBusiness.name || 'B')[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    {inspectedBusiness.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <span
                      style={{
                        background: '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#334155',
                      }}
                    >
                      {inspectedBusiness.category || inspectedBusiness.categoryRel?.name}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>ID #{inspectedBusiness.id}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedBusiness(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Información clave */}
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
                  DIRECCIÓN
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-title)' }}>
                  {inspectedBusiness.address || 'Sin dirección registrada'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, display: 'block' }}>
                  DUEÑO ASIGNADO
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-title)' }}>
                  {inspectedBusiness.owner?.name} ({inspectedBusiness.owner?.email})
                </span>
              </div>
            </div>

            {/* Servicios habilitados */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-title)' }}>
                Servicios Ofrecidos ({inspectedBusiness.services?.length || 0})
              </h4>
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(!inspectedBusiness.services || inspectedBusiness.services.length === 0) ? (
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>No tiene servicios configurados todavía.</div>
                ) : (
                  inspectedBusiness.services.map((s: any) => (
                    <div
                      key={s.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #f1f5f9',
                        background: '#fafbfc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.86rem', color: 'var(--text-title)' }}>{s.name}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '6px' }}>
                          ⏱ {s.durationMinutes} min
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.88rem' }}>${s.price}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer-responsive" style={{ margin: 0 }}>
              <button type="button" className="btn btn-light" onClick={() => setInspectedBusiness(null)}>
                Cerrar
              </button>
              <a
                href={`/businesses/${inspectedBusiness.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <ExternalLink size={15} /> Ver en sitio público
              </a>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, display: 'block' }}>CLIENTE</span>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-title)' }}>
                  {inspectedAppointment.user?.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{inspectedAppointment.user?.email}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, display: 'block' }}>COMERCIO Y SERVICIO</span>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0284c7' }}>
                  {inspectedAppointment.business?.name}
                </div>
                <div style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 600 }}>
                  {inspectedAppointment.service?.name} {inspectedAppointment.service?.price ? `· $${inspectedAppointment.service.price}` : ''}
                </div>
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
            </div>

            <div className="modal-footer-responsive" style={{ margin: 0 }}>
              <button type="button" className="btn btn-light" onClick={() => setInspectedAppointment(null)}>
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
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bug size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Ticket #{selectedReport.id}: {selectedReport.section}
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
              <div style={{ marginBottom: '1rem' }}>
                <label className="text-muted text-xs" style={{ fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                  RESUMEN DEL ERROR
                </label>
                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-title)' }}>
                  {selectedReport.summary}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="text-muted text-xs" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  PASOS A SEGUIR / REPRODUCCIÓN
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
    </div>
  );
};

export default SystemAdmin;
