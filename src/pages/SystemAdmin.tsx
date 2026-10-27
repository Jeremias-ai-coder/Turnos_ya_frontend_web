import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Building2, Calendar, ShieldCheck, Trash2, Bug, X, CheckCircle2, Eye, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTimeToHHMM } from '../utils/timeHelper';
import { SkeletonTable } from '../components/common/SkeletonLoaders';
import { Pagination } from '../components/common/Pagination';
import { type User, type Business, type Appointment } from '../types';
import { getAdminBugReportsApi, updateBugReportStatusApi } from '../services/bugReportService';

const ROLE_LABELS: Record<string, { label: string; badge: string }> = {
  client: { label: 'Cliente', badge: 'badge-completed' },
  owner: { label: 'Dueño', badge: 'badge-confirmed' },
  administrator: { label: 'Administrador', badge: 'badge-pending' },
};

const SystemAdmin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'users' | 'businesses' | 'appointments' | 'reports'>('users');
  const [stats, setStats] = useState({ totalUsers: 0, totalBusinesses: 0, totalAppointments: 0, totalAdmins: 0 });

  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Bug reports state
  const [reports, setReports] = useState<any[]>([]);
  const [reportsCounts, setReportsCounts] = useState({ pending: 0, inReview: 0, resolved: 0, discarded: 0, total: 0 });
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsStatusFilter, setReportsStatusFilter] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [savingReportId, setSavingReportId] = useState<number | null>(null);

  const [loadingTab, setLoadingTab] = useState(true);

  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [bizPage, setBizPage] = useState(1);
  const [aptPage, setAptPage] = useState(1);
  const PER_PAGE = 8;

  const [toast, setToast] = useState('');
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Check admin access
  useEffect(() => {
    if (user?.role !== 'administrator') navigate('/');
  }, [user, navigate]);

  // Load stats
  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
  }, []);

  // Load initial counts for reports
  useEffect(() => {
    getAdminBugReportsApi({ page: 1, limit: 1 })
      .then((res) => {
        if (res.counts) setReportsCounts(res.counts);
      })
      .catch(() => {});
  }, []);

  // Load data by tab
  useEffect(() => {
    setLoadingTab(true);
    if (activeTab === 'users') {
      api.get('/admin/users')
        .then(res => setUsers(res.data.data ?? []))
        .catch(err => console.error('users error', err))
        .finally(() => setLoadingTab(false));
    } else if (activeTab === 'businesses') {
      api.get('/businesses?limit=100')
        .then(res => setBusinesses(res.data.data ?? []))
        .catch(err => console.error('businesses error', err))
        .finally(() => setLoadingTab(false));
    } else if (activeTab === 'appointments') {
      api.get('/admin/appointments')
        .then(res => setAppointments(res.data.data ?? []))
        .catch(err => console.error('appointments error', err))
        .finally(() => setLoadingTab(false));
    } else if (activeTab === 'reports') {
      getAdminBugReportsApi({
        page: reportsPage,
        limit: PER_PAGE,
        status: reportsStatusFilter === 'ALL' ? undefined : reportsStatusFilter,
      })
        .then(res => {
          setReports(res.data ?? []);
          setReportsTotalPages(res.meta?.totalPages || 1);
          if (res.counts) setReportsCounts(res.counts);
        })
        .catch(err => console.error('reports error', err))
        .finally(() => setLoadingTab(false));
    }
  }, [activeTab, reportsPage, reportsStatusFilter]);

  const handleReportStatusChange = async (reportId: number, newStatus: string, notes?: string) => {
    setSavingReportId(reportId);
    try {
      await updateBugReportStatusApi(reportId, newStatus, notes);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus, adminNotes: notes !== undefined ? notes : r.adminNotes } : r))
      );
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport((prev: any) => ({ ...prev, status: newStatus, adminNotes: notes !== undefined ? notes : prev.adminNotes }));
      }
      showToast('✓ Estado del reporte actualizado');
      getAdminBugReportsApi({ page: 1, limit: 1 }).then((res) => {
        if (res.counts) setReportsCounts(res.counts);
      });
    } catch {
      showToast('Error al actualizar reporte');
    } finally {
      setSavingReportId(null);
    }
  };


  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast(`✓ Rol actualizado a ${ROLE_LABELS[newRole]?.label}`);
    } catch { showToast('Error al cambiar rol'); }
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (!confirm(`¿Eliminar a "${name}" del sistema?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast('✓ Usuario eliminado');
    } catch { showToast('Error al eliminar usuario'); }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalUsersPages = Math.ceil(filteredUsers.length / PER_PAGE);
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * PER_PAGE, usersPage * PER_PAGE);

  const totalBizPages = Math.ceil(businesses.length / PER_PAGE);
  const paginatedBusinesses = businesses.slice((bizPage - 1) * PER_PAGE, bizPage * PER_PAGE);

  const totalAptPages = Math.ceil(appointments.length / PER_PAGE);
  const paginatedAppointments = appointments.slice((aptPage - 1) * PER_PAGE, aptPage * PER_PAGE);

  const TABS = [
    { id: 'users', icon: <Users size={15} />, label: 'Gestión de Usuarios' },
    { id: 'businesses', icon: <Building2 size={15} />, label: 'Negocios Registrados' },
    { id: 'appointments', icon: <Calendar size={15} />, label: 'Turnos Globales' },
    {
      id: 'reports',
      icon: <Bug size={15} />,
      label: `Reportes de Errores ${reportsCounts.pending > 0 ? `(${reportsCounts.pending})` : ''}`,
    },
  ] as const;

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: '5rem', right: '1.5rem', zIndex: 2000, background: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
            <ShieldCheck size={20} color="var(--primary-color)" />
            <h1 style={{ color: 'var(--text-title)', fontSize: '1.75rem', fontWeight: 800 }}>Administración del Sistema</h1>
          </div>
          <p className="text-muted text-sm">Gestión global de usuarios, negocios y métricas de la plataforma.</p>
        </div>
        <button className="btn btn-outline-primary" onClick={() => navigate('/')} style={{ fontSize: '0.85rem' }}>
          ← Volver al Menú
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: <Users size={22} />, label: 'Usuarios Registrados', value: stats.totalUsers },
          { icon: <Building2 size={22} />, label: 'Negocios Activos', value: stats.totalBusinesses },
          { icon: <Calendar size={22} />, label: 'Turnos Totales', value: stats.totalAppointments },
          { icon: <ShieldCheck size={22} />, label: 'Administradores', value: stats.totalAdmins },
          {
            icon: <Bug size={22} color={reportsCounts.pending > 0 ? '#dc2626' : undefined} />,
            label: 'Reportes Pendientes',
            value: reportsCounts.pending,
          },
        ].map(k => (
          <div key={k.label} className="ml-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--status-pending-bg)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {k.icon}
            </div>
            <div>
              <p className="text-muted text-xs" style={{ marginBottom: '2px', fontWeight: 600 }}>{k.label}</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-title)', margin: 0 }}>{k.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Nav de pestañas */}
      <div className="ml-card" style={{ padding: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '4px', flexWrap: 'wrap', background: '#0f172a' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
            }}
            style={{
              padding: '8px 18px', border: '1px solid', borderRadius: '10px', cursor: 'pointer', fontWeight: 600,
              fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-family-base)',
              borderColor: activeTab === tab.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
              background: activeTab === tab.id ? 'var(--status-pending-bg)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.7)',
              transition: 'all 0.15s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ======= USUARIOS ======= */}
      {activeTab === 'users' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-title)' }}>Base de Usuarios</h3>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre o email..."
              value={userSearch}
              onChange={e => {
                setUserSearch(e.target.value);
                setUsersPage(1);
              }}
              style={{ maxWidth: '260px' }}
            />
          </div>

          {loadingTab ? (
            <SkeletonTable rows={6} columns={7} />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--background-app)' }}>
                      {['ID', 'Nombre', 'Email', 'Teléfono', 'Rol Actual', 'Cambiar Rol', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No se encontraron usuarios.</td></tr>
                    ) : paginatedUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{u.id}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: '12px 14px', fontSize: '0.88rem' }}>{u.email}</td>
                        <td style={{ padding: '12px 14px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`badge ${ROLE_LABELS[u.role]?.badge || 'badge-completed'}`}>
                            {ROLE_LABELS[u.role]?.label || u.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <select
                              className="form-control"
                              style={{ paddingRight: '2rem', fontSize: '0.82rem', width: 'auto' }}
                              value={u.role}
                              onChange={e => handleRoleChange(u.id, e.target.value)}
                            >
                              <option value="client">Cliente</option>
                              <option value="owner">Dueño</option>
                              <option value="administrator">Administrador</option>
                            </select>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button className="btn btn-light-danger" style={{ padding: '6px 10px' }} onClick={() => handleDeleteUser(u.id, u.name)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
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

      {/* ======= NEGOCIOS ======= */}
      {activeTab === 'businesses' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '1.25rem' }}>Negocios Registrados</h3>
          {loadingTab ? (
            <SkeletonTable rows={6} columns={5} />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--background-app)' }}>
                      {['ID', 'Nombre', 'Dirección', 'Dueño', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay negocios registrados.</td></tr>
                    ) : paginatedBusinesses.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{b.id}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{b.name}</td>
                        <td style={{ padding: '12px 14px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{b.address || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: '0.88rem' }}>{b.owner?.name || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <a href={`/businesses/${b.id}`} className="btn btn-light" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>Ver</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={bizPage}
                totalPages={totalBizPages}
                totalItems={businesses.length}
                itemsPerPage={PER_PAGE}
                onPageChange={setBizPage}
                itemLabel="negocios"
              />
            </>
          )}
        </div>
      )}

      {/* ======= TURNOS GLOBALES ======= */}
      {activeTab === 'appointments' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '1.25rem' }}>Listado Maestro de Turnos</h3>
          {loadingTab ? (
            <SkeletonTable rows={6} columns={6} />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--background-app)' }}>
                      {['ID', 'Cliente', 'Negocio', 'Servicio', 'Fecha y Hora', 'Estado'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay turnos.</td></tr>
                    ) : paginatedAppointments.map(apt => (
                      <tr key={apt.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>#{apt.id}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <p style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '1px' }}>{apt.user?.name || '—'}</p>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{apt.user?.email}</p>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.88rem' }}>{apt.business?.name || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: '0.88rem' }}>{apt.service?.name || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                          {(() => {
                            try {
                              const datePart = format(new Date(apt.date), 'd MMM yyyy', { locale: es });
                              const timePart = formatTimeToHHMM(apt.time);
                              return `${datePart} – ${timePart}`;
                            } catch { return '—'; }
                          })()}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`badge ${apt.status === 'CONFIRMED' ? 'badge-confirmed' : apt.status === 'CANCELLED' ? 'badge-cancelled' : apt.status === 'COMPLETED' ? 'badge-completed' : 'badge-pending'}`}>
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={aptPage}
                totalPages={totalAptPages}
                totalItems={appointments.length}
                itemsPerPage={PER_PAGE}
                onPageChange={setAptPage}
                itemLabel="turnos"
              />
            </>
          )}
        </div>
      )}

      {/* ======= REPORTES DE ERRORES ======= */}
      {activeTab === 'reports' && (
        <div className="ml-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontWeight: 700, color: 'var(--text-title)', margin: '0 0 4px' }}>Tickets y Reportes de Errores</h3>
              <p className="text-muted text-xs" style={{ margin: 0 }}>
                Tickets enviados por usuarios para seguimiento del equipo técnico.
              </p>
            </div>

            {/* Filtro por estado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="#64748b" />
              <select
                className="form-control"
                value={reportsStatusFilter}
                onChange={(e) => {
                  setReportsStatusFilter(e.target.value);
                  setReportsPage(1);
                }}
                style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto', minWidth: '150px' }}
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
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <CheckCircle2 size={26} />
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-title)' }}>
                No hay reportes en este estado
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                {reportsStatusFilter === 'PENDING'
                  ? '¡Excelente! No hay errores pendientes de revisión.'
                  : 'No se encontraron tickets con el filtro seleccionado.'}
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Usuario</th>
                      <th>Sección</th>
                      <th>Resumen del Error</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', color: '#64748b' }}>
                          {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-title)' }}>
                            {report.user?.name || 'Usuario'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{report.user?.email}</div>
                        </td>
                        <td>
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
                              maxWidth: '160px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={report.section}
                          >
                            {report.section}
                          </span>
                        </td>
                        <td style={{ maxWidth: '280px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-title)' }}>
                            {report.summary}
                          </span>
                        </td>
                        <td>
                          <select
                            value={report.status}
                            disabled={savingReportId === report.id}
                            onChange={(e) => handleReportStatusChange(report.id, e.target.value)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
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
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-light"
                            onClick={() => {
                              setSelectedReport(report);
                              setAdminNotesInput(report.adminNotes || '');
                            }}
                            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
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

      {/* MODAL DETALLE DE REPORTE PARA EL ADMINISTRADOR */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '100%' }}
          >
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
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', fontSize: '0.88rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {selectedReport.steps}
                </div>
              </div>

              {selectedReport.pageUrl && (
                <div style={{ marginBottom: '0.75rem', fontSize: '0.82rem', color: '#64748b' }}>
                  <strong>URL donde ocurrió:</strong>{' '}
                  <a href={selectedReport.pageUrl} target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'underline' }}>
                    {selectedReport.pageUrl}
                  </a>
                </div>
              )}

              {selectedReport.deviceInfo && (
                <div style={{ marginBottom: '1.25rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                  <strong>Navegador / Dispositivo:</strong> {selectedReport.deviceInfo}
                </div>
              )}

              {/* Notas del Administrador */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                  Notas internas del equipo técnico
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Escribí notas sobre la solución, commit o causa del error..."
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div className="modal-footer-responsive" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  disabled={savingReportId === selectedReport.id}
                  onClick={() => handleReportStatusChange(selectedReport.id, 'IN_REVIEW', adminNotesInput)}
                >
                  Poner en revisión
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  disabled={savingReportId === selectedReport.id}
                  onClick={() => handleReportStatusChange(selectedReport.id, 'RESOLVED', adminNotesInput)}
                >
                  <CheckCircle2 size={14} /> Marcar Resuelto
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleReportStatusChange(selectedReport.id, selectedReport.status, adminNotesInput);
                  setSelectedReport(null);
                }}
              >
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAdmin;
