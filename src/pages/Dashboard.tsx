import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Settings,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Building2,
  Star,
  MessageSquare,
  User,
  Check,
  Pencil,
  X,
  ExternalLink,
  MapPin,
  Phone,
  AlertTriangle,
  Eye,
  Mail,
  Globe,
  FileText,
  AlertCircle
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTimeToHHMM } from '../utils/timeHelper';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import { SkeletonTicket } from '../components/common/SkeletonLoaders';
import {
  type Business,
  type BusinessService as Service,
  type Schedule,
  type Appointment,
  type Review,
} from '../types';

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const STATUS_MAP: Record<string, string> = {
  PENDING: '⏳ Pendiente', CONFIRMED: '✓ Confirmado', CANCELLED: '✗ Cancelado', COMPLETED: '★ Completado',
};

const formatTime = (timeStr: string) => {
  return formatTimeToHHMM(timeStr);
};

const InstagramIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [copiedCuit, setCopiedCuit] = useState(false);

  const handleCopyCuit = (cuit: string) => {
    if (!cuit) return;
    navigator.clipboard.writeText(cuit);
    setCopiedCuit(true);
    setTimeout(() => setCopiedCuit(false), 2000);
  };
  const [activeTab, setActiveTab] = useState<'agenda' | 'services' | 'schedules' | 'reviews' | 'settings'>('agenda');

  const [agendaDate, setAgendaDate] = useState(new Date());
  const [agendaAppointments, setAgendaAppointments] = useState<Appointment[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsStats, setReviewsStats] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [reviewsPage, setReviewsPage] = useState(1);
  const REVIEWS_PER_PAGE = 5;

  // Initial load
  const [initialLoading, setInitialLoading] = useState(true);

  // Forms
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', durationMinutes: 30, price: 0 });

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' });
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '', address: '', phone: '', category: '' });
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    'Peluquería', 'Estética', 'Salud', 'Deportes', 'Trámites', 'Mascotas', 'Otros'
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const getFormattedTimeForInput = (timeVal: string) => {
    if (!timeVal) return '09:00';
    if (/^\d{2}:\d{2}$/.test(timeVal)) return timeVal;
    return formatTime(timeVal);
  };

  const handleStartEditService = (svc: Service) => {
    setEditingServiceId(svc.id);
    setServiceForm({
      name: svc.name,
      description: svc.description || '',
      durationMinutes: svc.durationMinutes ?? 30,
      price: Number(svc.price ?? 0)
    });
    setShowServiceForm(true);
  };

  const handleCancelEditService = () => {
    setEditingServiceId(null);
    setServiceForm({ name: '', description: '', durationMinutes: 30, price: 0 });
    setShowServiceForm(false);
  };

  const handleStartEditSchedule = (sch: Schedule) => {
    setEditingScheduleId(sch.id);
    setScheduleForm({
      dayOfWeek: sch.dayOfWeek,
      startTime: getFormattedTimeForInput(sch.startTime),
      endTime: getFormattedTimeForInput(sch.endTime)
    });
    setShowScheduleForm(true);
  };

  const handleCancelEditSchedule = () => {
    setEditingScheduleId(null);
    setScheduleForm({ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' });
    setShowScheduleForm(false);
  };

  // Load my businesses and categories
  useEffect(() => {
    setInitialLoading(true);
    api.get('/businesses/my').then(res => {
      const bizList = res.data.data ?? [];
      setBusinesses(bizList);
      if (bizList.length > 0) {
        setSelectedBiz(bizList[0]);
      }
    }).catch(() => {})
      .finally(() => setInitialLoading(false));

    api.get('/categories').then(res => {
      const list = res.data?.data ?? res.data;
      if (Array.isArray(list) && list.length > 0) {
        setAvailableCategories(list.map((c: any) => c.name));
      }
    }).catch(() => {});
  }, []);

  // When business changes, load services, schedules and reviews
  useEffect(() => {
    handleCancelEditService();
    handleCancelEditSchedule();
    if (!selectedBiz) return;
    setSettingsForm({
      name: selectedBiz.name || '',
      description: selectedBiz.description || '',
      address: selectedBiz.address || '',
      phone: selectedBiz.phone || '',
      category: selectedBiz.category || '',
    });
    Promise.all([
      api.get(`/businesses/${selectedBiz.id}/services`),
      api.get(`/businesses/${selectedBiz.id}/schedules`),
      api.get(`/businesses/${selectedBiz.id}/reviews`)
    ]).then(([sRes, schRes, rRes]) => {
      setServices(sRes.data.data ?? sRes.data ?? []);
      setSchedules(schRes.data ?? []);
      setReviews(rRes.data.data ?? []);
      setReviewsStats(rRes.data.stats ?? { average: 0, count: 0 });
    });
  }, [selectedBiz]);

  // Load agenda
  useEffect(() => {
    if (!selectedBiz) return;
    setAgendaLoading(true);
    const dateStr = format(agendaDate, 'yyyy-MM-dd');
    api.get(`/appointments?businessId=${selectedBiz.id}&date=${dateStr}`)
      .then(res => setAgendaAppointments(res.data.data ?? []))
      .catch(() => setAgendaAppointments([]))
      .finally(() => setAgendaLoading(false));
  }, [selectedBiz, agendaDate]);

  const handleCompleteAppointment = async (aptId: number) => {
    try {
      await api.patch(`/appointments/${aptId}/status`, { status: 'COMPLETED' });
      showToast('✓ Turno marcado como completado');
      setAgendaAppointments(prev =>
        prev.map(a => (a.id === aptId ? { ...a, status: 'COMPLETED' } : a))
      );
      // Actualizar reviews si se carga
      if (selectedBiz) {
        api.get(`/businesses/${selectedBiz.id}/reviews`).then(rRes => {
          setReviews(rRes.data.data ?? []);
          setReviewsStats(rRes.data.stats ?? { average: 0, count: 0 });
        });
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al completar el turno');
    }
  };


  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz) return;
    setSubmitting(true);
    try {
      if (editingServiceId) {
        const res = await api.put(`/businesses/${selectedBiz.id}/services/${editingServiceId}`, serviceForm);
        setServices(s => s.map(x => (x.id === editingServiceId ? res.data : x)));
        handleCancelEditService();
        showToast('✓ Servicio actualizado correctamente.');
      } else {
        const res = await api.post(`/businesses/${selectedBiz.id}/services`, serviceForm);
        setServices(s => [...s, res.data]);
        setServiceForm({ name: '', description: '', durationMinutes: 30, price: 0 });
        setShowServiceForm(false);
        showToast('Servicio agregado.');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || (editingServiceId ? 'Error al actualizar servicio.' : 'Error al crear servicio.'));
    } finally { setSubmitting(false); }
  };

  const handleDeleteService = async (svcId: number) => {
    if (!selectedBiz || !confirm('¿Eliminar este servicio?')) return;
    try {
      await api.delete(`/businesses/${selectedBiz.id}/services/${svcId}`);
      setServices(s => s.filter(x => x.id !== svcId));
      if (editingServiceId === svcId) {
        handleCancelEditService();
      }
      showToast('Servicio eliminado.');
    } catch { showToast('Error al eliminar.'); }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz) return;
    setSubmitting(true);
    try {
      if (editingScheduleId) {
        const res = await api.put(`/businesses/${selectedBiz.id}/schedules/${editingScheduleId}`, scheduleForm);
        setSchedules(s =>
          s.map(x => (x.id === editingScheduleId ? res.data : x))
        );
        handleCancelEditSchedule();
        showToast('✓ Horario actualizado correctamente.');
      } else {
        const res = await api.post(`/businesses/${selectedBiz.id}/schedules`, scheduleForm);
        setSchedules(s =>
          [...s, res.data].sort((a, b) => a.dayOfWeek - b.dayOfWeek || String(a.startTime).localeCompare(String(a.startTime)))
        );
        setScheduleForm({ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' });
        setShowScheduleForm(false);
        showToast('Horario agregado.');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || (editingScheduleId ? 'Error al actualizar horario.' : 'Error al crear horario.'));
    } finally { setSubmitting(false); }
  };

  const handleDeleteSchedule = async (schId: number) => {
    if (!selectedBiz || !confirm('¿Eliminar este horario?')) return;
    try {
      await api.delete(`/businesses/${selectedBiz.id}/schedules/${schId}`);
      setSchedules(s => s.filter(x => x.id !== schId));
      if (editingScheduleId === schId) {
        handleCancelEditSchedule();
      }
      showToast('Horario eliminado.');
    } catch { showToast('Error al eliminar.'); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz) return;
    setSubmitting(true);
    try {
      const res = await api.patch(`/businesses/${selectedBiz.id}`, settingsForm);
      setSelectedBiz(res.data);
      setBusinesses(bs => bs.map(b => b.id === res.data.id ? res.data : b));
      showToast('Configuración guardada.');
    } catch { showToast('Error al guardar.'); }
    finally { setSubmitting(false); }
  };

  const formatDateReview = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const TABS = [
    { id: 'agenda' as const, label: 'Agenda de Turnos', icon: <CalendarDays size={16} /> },
    { id: 'services' as const, label: `Servicios (${services.length})`, icon: <Briefcase size={16} /> },
    { id: 'schedules' as const, label: `Horarios (${schedules.length})`, icon: <Clock size={16} /> },
    { id: 'reviews' as const, label: `Opiniones (${reviewsStats.count})`, icon: <Star size={16} /> },
    { id: 'settings' as const, label: 'Configuración', icon: <Settings size={16} /> },
  ];

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, background: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: '0.9rem', fontWeight: 600 }}>
          {toast}
        </div>
      )}

      {initialLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="skeleton-box" style={{ height: '70px', borderRadius: '12px' }} />
            ))}
          </div>
          <div className="skeleton-box" style={{ height: '360px', borderRadius: '12px' }} />
        </div>
      ) : businesses.length === 0 ? (
        <div className="ml-card dashboard-card-responsive" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', margin: '2rem auto' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: '#e0f2fe', color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Building2 size={38} />
          </div>
          <h2 style={{ color: 'var(--text-title)', fontWeight: 800, marginBottom: '0.75rem', fontSize: '1.65rem' }}>
            ¡Llevá tu negocio al siguiente nivel!
          </h2>
          <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Sumá tu comercio a Turnos Ya para que tus clientes descubran tus servicios, consulten tus horarios y reserven turnos online en segundos con verificación profesional.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/register-business')}
            style={{ padding: '12px 32px', fontSize: '1rem', fontWeight: 800, borderRadius: '10px' }}
          >
            Registrar mi Negocio Ahora →
          </button>
        </div>
      ) : null}

      {selectedBiz && (
        <>
          {/* Banner de Estado de Verificación */}
          {selectedBiz.status === 'pending_approval' && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#dbeafe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontWeight: 800, color: '#1e3a8a', fontSize: '1.05rem' }}>
                      Comercio en Proceso de Verificación
                    </h4>
                    <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                      ⏳ En Revisión por Administración
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#1e40af' }}>
                    Tu solicitud está siendo auditada por el equipo de Turnos Ya. Mientras tanto, podés configurar tus servicios y horarios para que cuando sea aprobado esté listo de inmediato.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={() => setShowFichaModal(true)}
                  style={{ fontSize: '0.84rem', padding: '8px 14px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #bfdbfe', background: '#fff', color: '#1e40af' }}
                >
                  <Eye size={15} /> Ver Ficha Enviada
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => navigate('/register-business', { state: { business: selectedBiz } })}
                  style={{ fontSize: '0.84rem', padding: '8px 16px', fontWeight: 700 }}
                >
                  Editar datos / Evidencias
                </button>
              </div>
            </div>
          )}

          {selectedBiz.status === 'rejected' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontWeight: 800, color: '#991b1b', fontSize: '1.05rem' }}>
                        Solicitud de Negocio Observada
                      </h4>
                      <span className="badge badge-danger" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                        ✕ Requiere Modificaciones
                      </span>
                    </div>
                    <p style={{ margin: '6px 0', fontSize: '0.88rem', color: '#b91c1c' }}>
                      <strong>Motivo de la observación:</strong> {selectedBiz.rejectionReason || 'Se requiere verificar la información del local o corregir las evidencias.'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#7f1d1d' }}>
                      Podés modificar los datos solicitados y reenviar la solicitud para que un administrador la revise nuevamente.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => setShowFichaModal(true)}
                    style={{ fontSize: '0.84rem', padding: '8px 14px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #fecaca', background: '#fff', color: '#991b1b' }}
                  >
                    <Eye size={15} /> Ver Ficha Enviada
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => navigate('/register-business', { state: { business: selectedBiz } })}
                    style={{ fontSize: '0.86rem', padding: '9px 18px', fontWeight: 800 }}
                  >
                    Corregir y Reenviar Solicitud
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hero Card del Negocio */}
          <div className="dashboard-hero-card">
            <div className="dashboard-hero-left">
              <div className="dashboard-hero-avatar">
                {selectedBiz.name?.charAt(0).toUpperCase() || 'N'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h1 className="dashboard-hero-title">
                    {selectedBiz.name}
                  </h1>
                  {selectedBiz.category && (
                    <span className="badge badge-confirmed" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                      {selectedBiz.category}
                    </span>
                  )}
                </div>
                <div className="dashboard-hero-badges">
                  {selectedBiz.address && (
                    <span className="text-muted text-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} color="var(--primary-color)" /> {selectedBiz.address}
                    </span>
                  )}
                  {selectedBiz.phone && (
                    <span className="text-muted text-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                      <Phone size={12} color="var(--primary-color)" /> {selectedBiz.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setShowFichaModal(true)}
                style={{ padding: '7px 12px', fontSize: '0.82rem', gap: '6px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center' }}
                title="Ver ficha técnica completa y evidencias registradas"
              >
                <Eye size={14} color="#0284c7" />
                <span>Ficha Técnica</span>
              </button>

              <Link
                to={`/businesses/${selectedBiz.id}`}
                className="btn btn-light"
                style={{ padding: '7px 12px', fontSize: '0.82rem', gap: '6px', borderRadius: '8px' }}
                title="Ver cómo lo ven los clientes"
              >
                <ExternalLink size={14} color="var(--primary-color)" />
                <span>Ver perfil público</span>
              </Link>

              {businesses.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="text-muted text-xs fw-semibold">Local:</span>
                  <select
                    className="form-control"
                    style={{ width: 'auto', padding: '6px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
                    value={selectedBiz.id}
                    onChange={e => setSelectedBiz(businesses.find(b => b.id === Number(e.target.value)) || null)}
                  >
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* KPIs / Métricas Modernas */}
          <div className="dashboard-metrics-grid">
            {[
              { icon: <CalendarDays size={20} />, label: 'Turnos Hoy', value: agendaAppointments.length },
              { icon: <Briefcase size={20} />, label: 'Servicios', value: services.length },
              { icon: <Clock size={20} />, label: 'Horarios', value: schedules.length },
              { icon: <Star size={20} />, label: 'Calificación', value: reviewsStats.average > 0 ? `${reviewsStats.average.toFixed(1)} ★ (${reviewsStats.count})` : 'Nuevo' },
            ].map((m, i) => (
              <div key={i} className="metric-card-compact">
                <div className="metric-icon-compact">{m.icon}</div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div className="metric-title" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {m.label}
                  </div>
                  <div className="metric-value">{m.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Carrusel Horizontal de Pestañas */}
          <div className="dashboard-tabs-container">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`dashboard-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ======= AGENDA ======= */}
          {activeTab === 'agenda' && (
            <div className="ml-card dashboard-card-responsive">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <button className="btn btn-light" style={{ padding: '6px 8px' }} onClick={() => setAgendaDate(d => subDays(d, 1))} aria-label="Día anterior">
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-title)', padding: '0 6px', textTransform: 'capitalize' }}>
                      {format(agendaDate, "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                    <button className="btn btn-light" style={{ padding: '6px 8px' }} onClick={() => setAgendaDate(d => addDays(d, 1))} aria-label="Día siguiente">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <button className="btn btn-light" style={{ fontSize: '0.8rem', padding: '5px 11px', borderRadius: '20px' }} onClick={() => setAgendaDate(new Date())}>
                    Hoy
                  </button>
                </div>
                <span className="badge badge-pending" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                  {agendaAppointments.length} {agendaAppointments.length === 1 ? 'turno agendado' : 'turnos agendados'}
                </span>
              </div>

              {agendaLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[1, 2, 3].map(n => (
                    <SkeletonTicket key={n} />
                  ))}
                </div>
              ) : agendaAppointments.length === 0 ? (
                <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                  <CalendarDays size={42} color="var(--text-disabled)" style={{ marginBottom: '0.75rem' }} />
                  <p style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '4px', fontSize: '1rem' }}>Sin turnos para esta fecha</p>
                  <p className="text-muted text-sm" style={{ margin: 0 }}>No hay clientes agendados para este día.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {agendaAppointments.map(apt => (
                    <div
                      key={apt.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid var(--border-default)',
                        borderRadius: '12px',
                        background: apt.status === 'COMPLETED' ? '#f8fafc' : '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            background: '#e0f2fe',
                            color: 'var(--primary-color)',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Clock size={13} /> {formatTime(apt.time)} hs
                          </span>
                          <span className={`badge badge-${apt.status.toLowerCase()}`} style={{ fontSize: '0.75rem' }}>
                            {STATUS_MAP[apt.status] || apt.status}
                          </span>
                        </div>
                        {apt.service?.price && (
                          <span style={{ fontWeight: 800, color: 'var(--status-success-text)', fontSize: '1rem' }}>
                            ${apt.service.price}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: '#f1f5f9', color: '#475569',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                        }}>
                          {apt.user?.name ? apt.user.name.charAt(0).toUpperCase() : <User size={16} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 700, color: 'var(--text-title)', margin: '0 0 2px 0', fontSize: '0.92rem' }}>
                            {apt.user?.name || 'Cliente'}
                          </p>
                          <p className="text-muted text-xs" style={{ margin: 0 }}>
                            {apt.service?.name || 'Servicio'}
                          </p>
                        </div>
                      </div>

                      {apt.status === 'CONFIRMED' && (
                        <button
                          className="btn btn-success-fill"
                          style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '8px', marginTop: '2px' }}
                          onClick={() => handleCompleteAppointment(apt.id)}
                        >
                          <Check size={15} /> Marcar como Completado
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======= SERVICIOS ======= */}
          {activeTab === 'services' && (
            <div className="dashboard-panel-grid">
              {/* Lista de Servicios */}
              <div className="ml-card dashboard-card-responsive">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontWeight: 800, margin: 0, color: 'var(--text-title)', fontSize: '1.15rem' }}>
                      Servicios Publicados ({services.length})
                    </h3>
                    <p className="text-muted text-xs" style={{ margin: '2px 0 0 0' }}>
                      Servicios que tus clientes pueden reservar en tu negocio
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '7px 14px', fontSize: '0.85rem', borderRadius: '8px' }}
                    onClick={() => {
                      if (showServiceForm && !editingServiceId) {
                        setShowServiceForm(false);
                      } else {
                        handleCancelEditService();
                        setShowServiceForm(true);
                      }
                    }}
                  >
                    {showServiceForm && !editingServiceId ? <><X size={14} /> Cerrar</> : <><Plus size={15} /> Nuevo Servicio</>}
                  </button>
                </div>

                {services.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                    <Briefcase size={40} color="var(--text-disabled)" style={{ marginBottom: '0.75rem' }} />
                    <p style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '4px' }}>No hay servicios creados aún</p>
                    <p className="text-muted text-sm">Comienza agregando los servicios que ofreces a tus clientes.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {services.map(svc => {
                      const isEditing = editingServiceId === svc.id;
                      return (
                        <div key={svc.id} className={`service-item-card ${isEditing ? 'editing' : ''}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-title)', fontSize: '0.98rem' }}>
                                  {svc.name}
                                </span>
                                {isEditing && (
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'var(--primary-color)', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                                    Editando
                                  </span>
                                )}
                              </div>
                              {svc.description && (
                                <p className="text-muted text-xs" style={{ margin: '4px 0 0 0', lineHeight: 1.4 }}>
                                  {svc.description}
                                </p>
                              )}
                            </div>

                            <span style={{
                              fontWeight: 800,
                              color: 'var(--status-success-text)',
                              fontSize: '1.1rem',
                              background: '#ecfdf5',
                              padding: '3px 10px',
                              borderRadius: '8px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}>
                              ${Number(svc.price).toLocaleString('es-AR')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <Clock size={13} color="var(--primary-color)" /> {svc.durationMinutes} min
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-light"
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '0.8rem',
                                  gap: '4px',
                                  borderColor: isEditing ? 'var(--primary-color)' : undefined,
                                  color: isEditing ? 'var(--primary-color)' : undefined
                                }}
                                title="Editar servicio"
                                onClick={() => handleStartEditService(svc)}
                              >
                                <Pencil size={13} /> Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-light-danger"
                                style={{ padding: '5px 10px', fontSize: '0.8rem', gap: '4px' }}
                                title="Eliminar servicio"
                                onClick={() => handleDeleteService(svc.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Formulario nuevo / editar servicio */}
              <div className={`ml-card dashboard-card-responsive dashboard-form-panel ${showServiceForm || editingServiceId !== null ? 'open' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontWeight: 800, margin: 0, color: 'var(--text-title)', fontSize: '1.05rem' }}>
                    {editingServiceId ? 'Editar Servicio' : 'Agregar Servicio'}
                  </h4>
                  {(editingServiceId || showServiceForm) && (
                    <button
                      type="button"
                      className="btn btn-light"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={handleCancelEditService}
                    >
                      <X size={12} /> Cancelar
                    </button>
                  )}
                </div>

                {editingServiceId && (
                  <div style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                    fontWeight: 500
                  }}>
                    Modificá los datos del servicio y hacé clic en "Guardar Cambios".
                  </div>
                )}

                <form onSubmit={handleSaveService}>
                  <div className="form-group">
                    <label className="form-label">Nombre del servicio *</label>
                    <input className="form-control" placeholder="Ej. Corte y Peinado" value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <textarea className="form-control" rows={2} placeholder="Detalles del servicio..." value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Duración (min) *</label>
                      <input type="number" min={5} step={5} className="form-control" value={serviceForm.durationMinutes} onChange={e => setServiceForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Precio ($) *</label>
                      <input type="number" min={0} className="form-control" value={serviceForm.price} onChange={e => setServiceForm(f => ({ ...f, price: Number(e.target.value) }))} required />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                      {submitting ? (
                        <LoadingSpinner size="sm" inline text="Guardando..." color="white" />
                      ) : editingServiceId ? (
                        <><Check size={16} /> Guardar Cambios</>
                      ) : (
                        <><Plus size={16} /> Crear Servicio</>
                      )}
                    </button>
                    {editingServiceId && (
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={handleCancelEditService}
                        disabled={submitting}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ======= HORARIOS ======= */}
          {activeTab === 'schedules' && (
            <div className="dashboard-panel-grid">
              <div className="ml-card dashboard-card-responsive">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontWeight: 800, margin: 0, color: 'var(--text-title)', fontSize: '1.15rem' }}>
                      Horarios de Atención ({schedules.length})
                    </h3>
                    <p className="text-muted text-xs" style={{ margin: '2px 0 0 0' }}>
                      Franjas horarias en las que tu comercio recibe turnos
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '7px 14px', fontSize: '0.85rem', borderRadius: '8px' }}
                    onClick={() => {
                      if (showScheduleForm && !editingScheduleId) {
                        setShowScheduleForm(false);
                      } else {
                        handleCancelEditSchedule();
                        setShowScheduleForm(true);
                      }
                    }}
                  >
                    {showScheduleForm && !editingScheduleId ? <><X size={14} /> Cerrar</> : <><Plus size={15} /> Agregar Horario</>}
                  </button>
                </div>

                {schedules.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                    <Clock size={40} color="var(--text-disabled)" style={{ marginBottom: '0.75rem' }} />
                    <p style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '4px' }}>No hay horarios configurados</p>
                    <p className="text-muted text-sm">Configura los días y horarios en los que atiendes a tus clientes.</p>
                  </div>
                ) : (
                  <>
                    {/* Versión Móvil: Tarjetas elegantes por horario */}
                    <div className="schedule-mobile-list">
                      {[...schedules]
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || String(a.startTime).localeCompare(String(a.startTime)))
                        .map(sch => {
                          const isEditing = editingScheduleId === sch.id;
                          return (
                            <div key={sch.id} className={`schedule-item-mobile ${isEditing ? 'editing' : ''}`}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                  background: '#e0f2fe',
                                  color: 'var(--primary-color)',
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  minWidth: '78px',
                                  textAlign: 'center'
                                }}>
                                  {DAY_NAMES[sch.dayOfWeek]}
                                </span>
                                <span style={{ fontWeight: 800, color: 'var(--text-title)', fontSize: '0.92rem' }}>
                                  {formatTime(sch.startTime)} — {formatTime(sch.endTime)}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-light"
                                  style={{
                                    padding: '5px 8px',
                                    borderColor: isEditing ? 'var(--primary-color)' : undefined,
                                    color: isEditing ? 'var(--primary-color)' : undefined
                                  }}
                                  title="Editar horario"
                                  onClick={() => handleStartEditSchedule(sch)}
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-light-danger"
                                  style={{ padding: '5px 8px' }}
                                  title="Eliminar horario"
                                  onClick={() => handleDeleteSchedule(sch.id)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Versión Escritorio: Tabla tradicional con buen espacio */}
                    <table className="schedule-desktop-table">
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-default)' }}>
                          {['Día', 'Apertura', 'Cierre', 'Acciones'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...schedules]
                          .sort((a, b) => a.dayOfWeek - b.dayOfWeek || String(a.startTime).localeCompare(String(a.startTime)))
                          .map(sch => {
                            const isEditing = editingScheduleId === sch.id;
                            return (
                              <tr
                                key={sch.id}
                                style={{
                                  borderBottom: '1px solid var(--border-default)',
                                  backgroundColor: isEditing ? '#f0f9ff' : 'transparent',
                                  transition: 'background-color 0.2s'
                                }}
                              >
                                <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {DAY_NAMES[sch.dayOfWeek]}
                                    {isEditing && (
                                      <span style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        backgroundColor: 'var(--primary-color)',
                                        color: '#fff',
                                        padding: '1px 5px',
                                        borderRadius: '3px'
                                      }}>
                                        Editando
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '12px 14px' }}>{formatTime(sch.startTime)}</td>
                                <td style={{ padding: '12px 14px' }}>{formatTime(sch.endTime)}</td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <button
                                      type="button"
                                      className="btn btn-light"
                                      style={{
                                        padding: '6px 10px',
                                        borderColor: isEditing ? 'var(--primary-color)' : undefined,
                                        color: isEditing ? 'var(--primary-color)' : undefined
                                      }}
                                      title="Editar horario"
                                      onClick={() => handleStartEditSchedule(sch)}
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-light-danger"
                                      style={{ padding: '6px 10px' }}
                                      title="Eliminar horario"
                                      onClick={() => handleDeleteSchedule(sch.id)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </>
                )}
              </div>

              {/* Formulario nuevo / editar horario */}
              <div className={`ml-card dashboard-card-responsive dashboard-form-panel ${showScheduleForm || editingScheduleId !== null ? 'open' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontWeight: 800, margin: 0, color: 'var(--text-title)', fontSize: '1.05rem' }}>
                    {editingScheduleId ? 'Editar Horario' : 'Agregar Día y Horario'}
                  </h4>
                  {(editingScheduleId || showScheduleForm) && (
                    <button
                      type="button"
                      className="btn btn-light"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={handleCancelEditSchedule}
                    >
                      <X size={12} /> Cancelar
                    </button>
                  )}
                </div>

                {editingScheduleId && (
                  <div style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                    fontWeight: 500
                  }}>
                    Modificá el día u horario y hacé clic en "Guardar Cambios".
                  </div>
                )}

                <form onSubmit={handleSaveSchedule}>
                  <div className="form-group">
                    <label className="form-label">Día de la semana *</label>
                    <select className="form-control" value={scheduleForm.dayOfWeek} onChange={e => setScheduleForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}>
                      {[1, 2, 3, 4, 5, 6, 7].map(d => (
                        <option key={d} value={d}>{DAY_NAMES[d]}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Apertura *</label>
                      <input type="time" className="form-control" value={scheduleForm.startTime} onChange={e => setScheduleForm(f => ({ ...f, startTime: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cierre *</label>
                      <input type="time" className="form-control" value={scheduleForm.endTime} onChange={e => setScheduleForm(f => ({ ...f, endTime: e.target.value }))} required />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                      {submitting ? (
                        <LoadingSpinner size="sm" inline text="Guardando..." color="white" />
                      ) : editingScheduleId ? (
                        <><Check size={16} /> Guardar Cambios</>
                      ) : (
                        <><Plus size={16} /> Guardar Horario</>
                      )}
                    </button>
                    {editingScheduleId && (
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={handleCancelEditSchedule}
                        disabled={submitting}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ======= OPINIONES Y RESEÑAS ======= */}
          {activeTab === 'reviews' && (
            <div>
              {/* Score card resumen */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                border: '1px solid #a7f3d0',
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#065f46', lineHeight: 1 }}>
                      {reviewsStats.average > 0 ? reviewsStats.average.toFixed(1) : '5.0'}
                    </div>
                    <div style={{ display: 'flex', gap: '2px', marginTop: '6px', justifyContent: 'center' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={16}
                          fill={star <= Math.round(reviewsStats.average || 5) ? '#f59e0b' : 'none'}
                          color={star <= Math.round(reviewsStats.average || 5) ? '#f59e0b' : '#cbd5e1'}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontWeight: 800, color: '#065f46', margin: 0, fontSize: '1.15rem' }}>
                      Calificación General del Comercio
                    </h3>
                    <p style={{ color: '#047857', margin: '3px 0 0 0', fontSize: '0.85rem' }}>
                      Basado en <strong>{reviewsStats.count}</strong> {reviewsStats.count === 1 ? 'opinión de cliente verificado' : 'opiniones de clientes verificados'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de Reseñas */}
              <div className="ml-card dashboard-card-responsive">
                <h3 style={{ fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                  <MessageSquare size={18} color="var(--primary-color)" /> Comentarios y Feedback Recibido
                </h3>

                {reviews.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                    <MessageSquare size={42} color="var(--text-disabled)" style={{ marginBottom: '0.75rem' }} />
                    <p style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '4px' }}>Aún no has recibido opiniones</p>
                    <p className="text-muted text-sm">Cuando tus clientes completen sus turnos, podrán dejarte calificaciones y comentarios aquí.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                      {reviews
                        .slice((reviewsPage - 1) * REVIEWS_PER_PAGE, reviewsPage * REVIEWS_PER_PAGE)
                        .map(rev => (
                          <div
                            key={rev.id}
                            style={{
                              border: '1px solid var(--border-default)',
                              borderRadius: '12px',
                              padding: '1rem',
                              background: 'white'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: '#e0f2fe',
                                  color: 'var(--primary-color)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.95rem'
                                }}>
                                  {rev.appointment?.user?.name ? rev.appointment.user.name[0].toUpperCase() : <User size={16} />}
                                </div>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '0.92rem', margin: 0, color: 'var(--text-title)' }}>
                                    {rev.appointment?.user?.name || 'Cliente'}
                                  </p>
                                  {rev.appointment?.service?.name && (
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                      Servicio: <strong>{rev.appointment.service.name}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end', marginBottom: '2px' }}>
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star
                                      key={s}
                                      size={15}
                                      fill={s <= rev.rating ? '#f59e0b' : 'none'}
                                      color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'}
                                    />
                                  ))}
                                </div>
                                <span className="text-muted text-xs">{formatDateReview(rev.createdAt)}</span>
                              </div>
                            </div>

                            {rev.comment ? (
                              <div style={{ margin: '8px 0 0 0', background: '#f8fafc', padding: '9px 12px', borderRadius: '8px', borderLeft: '3px solid var(--primary-color)' }}>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.5 }}>
                                  "{rev.comment}"
                                </p>
                              </div>
                            ) : (
                              <p className="text-muted text-xs" style={{ margin: '6px 0 0 0', fontStyle: 'italic' }}>
                                El cliente calificó con {rev.rating} estrellas sin comentario escrito.
                              </p>
                            )}
                          </div>
                        ))}
                    </div>

                    <Pagination
                      currentPage={reviewsPage}
                      totalPages={Math.ceil(reviews.length / REVIEWS_PER_PAGE)}
                      onPageChange={setReviewsPage}
                      totalItems={reviews.length}
                      itemsPerPage={REVIEWS_PER_PAGE}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ======= CONFIGURACIÓN ======= */}
          {activeTab === 'settings' && (
            <div className="ml-card dashboard-card-responsive" style={{ maxWidth: '640px' }}>
              <h3 style={{ fontWeight: 800, marginBottom: '0.25rem', color: 'var(--text-title)', fontSize: '1.15rem' }}>Configuración del Negocio</h3>
              <p className="text-muted text-xs" style={{ margin: '0 0 1.25rem 0' }}>
                Actualiza los datos de tu comercio visibles para los clientes
              </p>
              <form onSubmit={handleSaveSettings}>
                <div className="form-group">
                  <label className="form-label">Nombre del Negocio *</label>
                  <input className="form-control" value={settingsForm.name} onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-control" rows={3} placeholder="Describe los servicios y especialidad de tu local..." value={settingsForm.description} onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Dirección</label>
                    <input className="form-control" placeholder="Ej. Calle 123, CABA" value={settingsForm.address} onChange={e => setSettingsForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input className="form-control" placeholder="Ej. 11 2345-6789" value={settingsForm.phone} onChange={e => setSettingsForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <select className="form-control" value={settingsForm.category} onChange={e => setSettingsForm(f => ({ ...f, category: e.target.value }))} required>
                    <option value="">Seleccionar categoría...</option>
                    {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', padding: '0.75rem 1.5rem', marginTop: '0.5rem' }}>
                  {submitting ? (
                    <LoadingSpinner size="sm" inline text="Guardando..." color="white" />
                  ) : (
                    <><Settings size={16} /> Guardar Configuración</>
                  )}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* Modal Ficha Completa del Negocio para el Propietario */}
      {showFichaModal && selectedBiz && (
        <div className="modal-overlay" onClick={() => setShowFichaModal(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '720px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-drag-handle" />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: selectedBiz.status === 'pending_approval' ? '#fef3c7' : selectedBiz.status === 'rejected' ? '#fee2e2' : '#e0f2fe',
                    color: selectedBiz.status === 'pending_approval' ? '#b45309' : selectedBiz.status === 'rejected' ? '#dc2626' : '#0284c7',
                    fontWeight: 800,
                    fontSize: '1.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {(selectedBiz.name || 'B')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                      {selectedBiz.name}
                    </h3>
                    {selectedBiz.status === 'pending_approval' && (
                      <span className="badge badge-warning" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                        ⏳ En Revisión por Administración
                      </span>
                    )}
                    {selectedBiz.status === 'approved' && (
                      <span className="badge badge-confirmed" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                        ✓ Aprobado y Publicado
                      </span>
                    )}
                    {selectedBiz.status === 'rejected' && (
                      <span className="badge badge-danger" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                        ✕ Requiere Modificaciones
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    <span>{selectedBiz.category || 'General'}</span> • <span>ID #{selectedBiz.id}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFichaModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px', margin: '14px 0', flex: 1 }}>
              {selectedBiz.status === 'rejected' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#991b1b', fontSize: '0.86rem' }}>Observación del Administrador:</strong>
                    <p style={{ margin: '4px 0 0', color: '#b91c1c', fontSize: '0.82rem' }}>
                      {selectedBiz.rejectionReason || 'No se registraron detalles específicos.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Identidad */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Descripción Comercial
                </span>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-title)', lineHeight: '1.4' }}>
                  {selectedBiz.description || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin descripción.</span>}
                </p>
                {selectedBiz.email && (
                  <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={13} color="#0284c7" /> Email: <strong>{selectedBiz.email}</strong>
                  </div>
                )}
              </div>

              {/* Ubicación */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Ubicación y Contacto
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.84rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Dirección:</span> <strong>{selectedBiz.address || 'N/A'}</strong>
                    {(selectedBiz.city || selectedBiz.province) && (
                      <span style={{ display: 'block', color: '#64748b', fontSize: '0.78rem' }}>
                        {[selectedBiz.city, selectedBiz.province].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Teléfono:</span> <strong>{selectedBiz.phone || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Evidencias de Veracidad */}
              <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px' }}>
                <span style={{ fontSize: '0.74rem', color: '#1e40af', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Evidencias de Veracidad y Redes
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {/* IG */}
                  <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '6px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#e1306c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <InstagramIcon size={12} color="#e1306c" /> Instagram
                      </span>
                      {selectedBiz.instagramUrl && (
                        <a href={selectedBiz.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: '#e1306c', fontWeight: 700 }}>
                          Ver ↗
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#881337', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }}>
                      {selectedBiz.instagramUrl || <span style={{ color: '#fda4af' }}>No adjuntado</span>}
                    </div>
                  </div>

                  {/* FB */}
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1877f2', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FacebookIcon size={12} color="#1877f2" /> Facebook
                      </span>
                      {selectedBiz.facebookUrl && (
                        <a href={selectedBiz.facebookUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: '#1877f2', fontWeight: 700 }}>
                          Ver ↗
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#1e3a8a', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }}>
                      {selectedBiz.facebookUrl || <span style={{ color: '#93c5fd' }}>No adjuntado</span>}
                    </div>
                  </div>

                  {/* Maps */}
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="#dc2626" /> Google Maps
                      </span>
                      {selectedBiz.googleMapsUrl && (
                        <a href={selectedBiz.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 700 }}>
                          Ver ↗
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#7f1d1d', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }}>
                      {selectedBiz.googleMapsUrl || <span style={{ color: '#fca5a5' }}>No adjuntado</span>}
                    </div>
                  </div>

                  {/* Web */}
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Globe size={12} color="#0284c7" /> Sitio Web
                      </span>
                      {selectedBiz.websiteUrl && (
                        <a href={selectedBiz.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700 }}>
                          Ver ↗
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#0c4a6e', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }}>
                      {selectedBiz.websiteUrl || <span style={{ color: '#7dd3fc' }}>No adjuntado</span>}
                    </div>
                  </div>

                  {/* CUIT */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={12} color="#475569" /> CUIT
                      </span>
                      {selectedBiz.cuit && (
                        <button
                          type="button"
                          onClick={() => handleCopyCuit(selectedBiz.cuit!)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: '#0284c7', fontWeight: 700, padding: 0 }}
                        >
                          {copiedCuit ? '¡Copiado!' : 'Copiar'}
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 700, marginTop: '2px', fontFamily: 'monospace' }}>
                      {selectedBiz.cuit || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontFamily: 'inherit' }}>No declarado</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-responsive" style={{ margin: 0, paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <button type="button" className="btn btn-light" onClick={() => setShowFichaModal(false)}>
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowFichaModal(false);
                  navigate('/register-business', { state: { business: selectedBiz } });
                }}
              >
                <Pencil size={14} /> Editar Información
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
