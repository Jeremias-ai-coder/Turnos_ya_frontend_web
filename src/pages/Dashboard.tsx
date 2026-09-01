import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Settings,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Building2,
  Star,
  MessageSquare,
  User,
  Check,
  Pencil,
  X
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTimeToHHMM } from '../utils/timeHelper';

interface Business { id: number; name: string; description: string; address: string; phone: string; category: string; }
interface Service { id: number; name: string; description: string; durationMinutes: number; price: number; }
interface Schedule { id: number; dayOfWeek: number; startTime: string; endTime: string; }
interface Appointment {
  id: number;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  cancelledReason?: string;
  user?: { name: string; email: string };
  service?: { name: string; price: number };
}
interface Review {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  appointment?: {
    user?: { id: number; name: string };
    service?: { id: number; name: string };
  };
}

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const STATUS_MAP: Record<string, string> = {
  PENDING: '⏳ Pendiente', CONFIRMED: '✓ Confirmado', CANCELLED: '✗ Cancelado', COMPLETED: '★ Completado',
};

const formatTime = (timeStr: string) => {
  return formatTimeToHHMM(timeStr);
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState<'agenda' | 'services' | 'schedules' | 'reviews' | 'settings'>('agenda');

  const [agendaDate, setAgendaDate] = useState(new Date());
  const [agendaAppointments, setAgendaAppointments] = useState<Appointment[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsStats, setReviewsStats] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Forms
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', durationMinutes: 30, price: 0 });
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' });
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '', address: '', phone: '', category: '' });

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [noBusinessForm, setNoBusinessForm] = useState({ name: '', description: '', address: '' });

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
      durationMinutes: svc.durationMinutes,
      price: Number(svc.price)
    });
  };

  const handleCancelEditService = () => {
    setEditingServiceId(null);
    setServiceForm({ name: '', description: '', durationMinutes: 30, price: 0 });
  };

  const handleStartEditSchedule = (sch: Schedule) => {
    setEditingScheduleId(sch.id);
    setScheduleForm({
      dayOfWeek: sch.dayOfWeek,
      startTime: getFormattedTimeForInput(sch.startTime),
      endTime: getFormattedTimeForInput(sch.endTime)
    });
  };

  const handleCancelEditSchedule = () => {
    setEditingScheduleId(null);
    setScheduleForm({ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' });
  };

  // Load my businesses
  useEffect(() => {
    api.get('/businesses/my').then(res => {
      const bizList = res.data.data ?? [];
      setBusinesses(bizList);
      if (bizList.length > 0) {
        setSelectedBiz(bizList[0]);
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

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/businesses', noBusinessForm);
      setBusinesses([res.data]);
      setSelectedBiz(res.data);
      showToast('¡Negocio creado con éxito!');
    } catch {
      showToast('Error al crear negocio.');
    } finally { setSubmitting(false); }
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
          [...s, res.data].sort((a, b) => a.dayOfWeek - b.dayOfWeek || String(a.startTime).localeCompare(String(b.startTime)))
        );
        setScheduleForm({ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' });
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
    { id: 'services' as const, label: 'Servicios', icon: <Briefcase size={16} /> },
    { id: 'schedules' as const, label: 'Horarios de Atención', icon: <Clock size={16} /> },
    { id: 'reviews' as const, label: `Opiniones y Reseñas (${reviewsStats.count})`, icon: <Star size={16} /> },
    { id: 'settings' as const, label: 'Configuración', icon: <Settings size={16} /> },
  ];

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, background: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: '0.9rem', fontWeight: 600 }}>
          {toast}
        </div>
      )}

      {/* Header del Dashboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-title)', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            Panel de Control
          </h1>
          <p className="text-muted text-sm" style={{ margin: '2px 0 0 0' }}>
            Gestiona la agenda, servicios, opiniones y configuración de tu local.
          </p>
        </div>

        {businesses.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="text-muted text-sm fw-semibold">Local:</span>
            <select
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.88rem' }}
              value={selectedBiz?.id}
              onChange={e => setSelectedBiz(businesses.find(b => b.id === Number(e.target.value)) || null)}
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {businesses.length === 0 && (
        <div className="ml-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Building2 size={56} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--text-title)', fontWeight: 800, marginBottom: '0.5rem' }}>¡Bienvenido a Turnos Ya!</h2>
          <p className="text-muted" style={{ marginBottom: '2rem', maxWidth: '460px', margin: '0 auto 2rem' }}>
            Para comenzar a administrar tus citas, primero debes registrar tu negocio.
          </p>
          <form onSubmit={handleCreateBusiness} style={{ maxWidth: '420px', margin: '0 auto', textAlign: 'left' }}>
            <div className="form-group">
              <label className="form-label">Nombre del negocio *</label>
              <input className="form-control" placeholder="Ej. Barbería Central" value={noBusinessForm.name} onChange={e => setNoBusinessForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea className="form-control" rows={2} placeholder="Descripción breve..." value={noBusinessForm.description} onChange={e => setNoBusinessForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Dirección comercial</label>
              <input className="form-control" placeholder="Av. de Mayo 1234, CABA" value={noBusinessForm.address} onChange={e => setNoBusinessForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Creando...' : 'Guardar negocio e iniciar'}
            </button>
          </form>
        </div>
      )}

      {selectedBiz && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { icon: <CalendarDays size={22} />, label: 'Turnos de Hoy', value: agendaAppointments.length },
              { icon: <Briefcase size={22} />, label: 'Servicios Activos', value: services.length },
              { icon: <Clock size={22} />, label: 'Horarios Configurados', value: schedules.length },
              { icon: <Star size={22} />, label: 'Calificación de Clientes', value: reviewsStats.average > 0 ? `${reviewsStats.average.toFixed(1)} ★ (${reviewsStats.count})` : 'Nuevo' },
            ].map((m, i) => (
              <div key={i} className="metric-card">
                <div className="metric-icon">{m.icon}</div>
                <div>
                  <div className="metric-title">{m.label}</div>
                  <div className="metric-value">{m.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Nav de pestañas */}
          <div className="ml-card" style={{ padding: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px', border: '1px solid', borderRadius: '10px', cursor: 'pointer', fontWeight: 600,
                  fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-family-base)',
                  borderColor: activeTab === tab.id ? 'var(--primary-color)' : 'transparent',
                  background: activeTab === tab.id ? 'var(--status-pending-bg)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ======= AGENDA ======= */}
          {activeTab === 'agenda' && (
            <div className="ml-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className="btn btn-light" style={{ padding: '6px 10px' }} onClick={() => setAgendaDate(d => subDays(d, 1))}>
                    <ChevronLeft size={16} />
                  </button>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-title)' }}>
                    {format(agendaDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </h3>
                  <button className="btn btn-light" style={{ padding: '6px 10px' }} onClick={() => setAgendaDate(d => addDays(d, 1))}>
                    <ChevronRight size={16} />
                  </button>
                  <button className="btn btn-light" style={{ fontSize: '0.82rem', padding: '6px 12px' }} onClick={() => setAgendaDate(new Date())}>
                    Hoy
                  </button>
                </div>
                <span className="badge badge-pending" style={{ fontSize: '0.82rem' }}>
                  {agendaAppointments.length} turnos agendados
                </span>
              </div>

              {agendaLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }} className="text-muted">Cargando agenda...</div>
              ) : agendaAppointments.length === 0 ? (
                <div className="empty-state">
                  <CalendarDays size={48} color="var(--text-disabled)" style={{ marginBottom: '1rem' }} />
                  <p style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '4px' }}>Sin turnos para esta fecha</p>
                  <p className="text-muted text-sm">No hay clientes agendados para este día.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {agendaAppointments.map(apt => (
                    <div
                      key={apt.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1rem 1.25rem', border: '1px solid var(--border-default)',
                        borderRadius: '10px', flexWrap: 'wrap', gap: '1rem',
                        background: apt.status === 'COMPLETED' ? '#f8fafc' : 'white'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '60px', fontWeight: 800, color: 'var(--primary-color)', fontSize: '1.1rem' }}>
                          {formatTime(apt.time)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '2px' }}>
                            {apt.user?.name || 'Cliente'}
                          </p>
                          <p className="text-muted text-xs">
                            {apt.service?.name} · ${apt.service?.price}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className={`badge badge-${apt.status.toLowerCase()}`}>
                          {STATUS_MAP[apt.status] || apt.status}
                        </span>

                        {apt.status === 'CONFIRMED' && (
                          <button
                            className="btn btn-success-fill"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleCompleteAppointment(apt.id)}
                          >
                            <Check size={14} /> Marcar como Completado
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======= SERVICIOS ======= */}
          {activeTab === 'services' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
              <div className="ml-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-title)' }}>Servicios Publicados ({services.length})</h3>
                {services.length === 0 ? (
                  <div className="empty-state">No hay servicios creados aún.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {services.map(svc => {
                      const isEditing = editingServiceId === svc.id;
                      return (
                        <div
                          key={svc.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem',
                            border: `1px solid ${isEditing ? 'var(--primary-color)' : 'var(--border-default)'}`,
                            backgroundColor: isEditing ? '#f0f9ff' : 'var(--bg-card)',
                            borderRadius: '10px',
                            transition: 'all 0.2s ease',
                            boxShadow: isEditing ? '0 0 0 2px rgba(0, 158, 227, 0.15)' : 'none'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                              <p style={{ fontWeight: 700, color: 'var(--text-title)', margin: 0 }}>{svc.name}</p>
                              {isEditing && (
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  backgroundColor: 'var(--primary-color)',
                                  color: '#fff',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}>
                                  Editando
                                </span>
                              )}
                            </div>
                            <p className="text-muted text-xs" style={{ marginBottom: '4px' }}>{svc.description || 'Sin descripción'}</p>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>⏱ {svc.durationMinutes} min</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--status-success-text)', fontSize: '1.1rem', marginRight: '0.5rem' }}>${svc.price}</span>
                            <button
                              type="button"
                              className="btn btn-light"
                              style={{
                                padding: '6px 10px',
                                borderColor: isEditing ? 'var(--primary-color)' : undefined,
                                color: isEditing ? 'var(--primary-color)' : undefined
                              }}
                              title="Editar servicio"
                              onClick={() => handleStartEditService(svc)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-light-danger"
                              style={{ padding: '6px 10px' }}
                              title="Eliminar servicio"
                              onClick={() => handleDeleteService(svc.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Formulario nuevo / editar servicio */}
              <div className="ml-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontWeight: 700, margin: 0, color: 'var(--text-title)' }}>
                    {editingServiceId ? 'Editar Servicio' : 'Agregar Servicio'}
                  </h4>
                  {editingServiceId && (
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
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                    fontWeight: 500
                  }}>
                    Modifica los datos del servicio y haz clic en "Guardar Cambios".
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
                      <input type="number" min={10} step={5} className="form-control" value={serviceForm.durationMinutes} onChange={e => setServiceForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Precio ($) *</label>
                      <input type="number" min={0} className="form-control" value={serviceForm.price} onChange={e => setServiceForm(f => ({ ...f, price: Number(e.target.value) }))} required />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                      {editingServiceId ? (
                        <><Check size={16} /> {submitting ? 'Guardando...' : 'Guardar Cambios'}</>
                      ) : (
                        <><Plus size={16} /> {submitting ? 'Agregando...' : 'Crear Servicio'}</>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
              <div className="ml-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-title)' }}>Horarios de Atención Configurados</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-default)' }}>
                      {['Día', 'Apertura', 'Cierre', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay horarios configurados.</td></tr>
                    ) : [...schedules]
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || String(a.startTime).localeCompare(String(b.startTime)))
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
              </div>

              {/* Formulario nuevo / editar horario */}
              <div className="ml-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontWeight: 700, margin: 0, color: 'var(--text-title)' }}>
                    {editingScheduleId ? 'Editar Horario' : 'Agregar Día y Horario'}
                  </h4>
                  {editingScheduleId && (
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
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                    fontWeight: 500
                  }}>
                    Modifica el día u horario y haz clic en "Guardar Cambios".
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
                      {editingScheduleId ? (
                        <><Check size={16} /> {submitting ? 'Guardando...' : 'Guardar Cambios'}</>
                      ) : (
                        <><Plus size={16} /> {submitting ? 'Guardando...' : 'Guardar Horario'}</>
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
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#065f46', lineHeight: 1 }}>
                      {reviewsStats.average > 0 ? reviewsStats.average.toFixed(1) : '5.0'}
                    </div>
                    <div style={{ display: 'flex', gap: '2px', marginTop: '6px', justifyContent: 'center' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={18}
                          fill={star <= Math.round(reviewsStats.average || 5) ? '#f59e0b' : 'none'}
                          color={star <= Math.round(reviewsStats.average || 5) ? '#f59e0b' : '#cbd5e1'}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontWeight: 800, color: '#065f46', margin: 0, fontSize: '1.25rem' }}>
                      Calificación General del Comercio
                    </h3>
                    <p style={{ color: '#047857', margin: '4px 0 0 0', fontSize: '0.88rem' }}>
                      Basado en <strong>{reviewsStats.count}</strong> {reviewsStats.count === 1 ? 'opinión de cliente verificado' : 'opiniones de clientes verificados'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de Reseñas */}
              <div className="ml-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={20} color="var(--primary-color)" /> Comentarios y Feedback Recibido
                </h3>

                {reviews.length === 0 ? (
                  <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                    <MessageSquare size={48} color="var(--text-disabled)" style={{ marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '4px' }}>Aún no has recibido opiniones</p>
                    <p className="text-muted text-sm">Cuando tus clientes completen sus turnos, podrán dejarte calificaciones y comentarios aquí.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reviews.map(rev => (
                      <div
                        key={rev.id}
                        style={{
                          border: '1px solid var(--border-default)',
                          borderRadius: '10px',
                          padding: '1.25rem',
                          background: 'white'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: '#e0f2fe',
                              color: 'var(--primary-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '1rem'
                            }}>
                              {rev.appointment?.user?.name ? rev.appointment.user.name[0].toUpperCase() : <User size={18} />}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: '0.98rem', margin: 0, color: 'var(--text-title)' }}>
                                {rev.appointment?.user?.name || 'Cliente'}
                              </p>
                              {rev.appointment?.service?.name && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  Servicio realizado: <strong>{rev.appointment.service.name}</strong>
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                  key={s}
                                  size={16}
                                  fill={s <= rev.rating ? '#f59e0b' : 'none'}
                                  color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'}
                                />
                              ))}
                            </div>
                            <span className="text-muted text-xs">{formatDateReview(rev.createdAt)}</span>
                          </div>
                        </div>

                        {rev.comment ? (
                          <div style={{ margin: '10px 0 0 0', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--primary-color)' }}>
                            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.5 }}>
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
                )}
              </div>
            </div>
          )}

          {/* ======= CONFIGURACIÓN ======= */}
          {activeTab === 'settings' && (
            <div className="ml-card" style={{ padding: '2rem', maxWidth: '640px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-title)' }}>Configuración del Negocio</h3>
              <form onSubmit={handleSaveSettings}>
                <div className="form-group">
                  <label className="form-label">Nombre del Negocio</label>
                  <input className="form-control" value={settingsForm.name} onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-control" rows={3} value={settingsForm.description} onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Dirección</label>
                    <input className="form-control" value={settingsForm.address} onChange={e => setSettingsForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input className="form-control" value={settingsForm.phone} onChange={e => setSettingsForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-control" value={settingsForm.category} onChange={e => setSettingsForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">Seleccionar categoría...</option>
                    {['Peluquería', 'Estética', 'Salud', 'Deportes', 'Otros'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '0.75rem 2rem' }}>
                  <Settings size={16} /> {submitting ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
