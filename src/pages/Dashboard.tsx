import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays, Briefcase, Clock, Users, Plus, Trash2, ChevronLeft, ChevronRight, Building2, Settings
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface Business { id: number; name: string; address: string; description: string; category: string; phone: string; }
interface Service { id: number; name: string; description: string; durationMinutes: number; price: number; }
interface Schedule { id: number; dayOfWeek: number; startTime: string; endTime: string; }
interface Appointment {
  id: number; date: string; time: string; status: string;
  user?: { name: string; email: string };
  service?: { name: string; durationMinutes: number };
}

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const STATUS_MAP: Record<string, string> = {
  PENDING: '⏳ Pendiente', CONFIRMED: '✓ Confirmado', CANCELLED: '✗ Cancelado', COMPLETED: '★ Completado',
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return '--';
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return timeStr;
  }
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState<'agenda' | 'services' | 'schedules' | 'settings'>('agenda');

  const [agendaDate, setAgendaDate] = useState(new Date());
  const [agendaAppointments, setAgendaAppointments] = useState<Appointment[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Forms
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', durationMinutes: 30, price: 0 });
  const [scheduleForm, setScheduleForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' });
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '', address: '', phone: '', category: '' });

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [noBusinessForm, setNoBusinessForm] = useState({ name: '', description: '', address: '' });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

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

  // When business changes, load services and schedules
  useEffect(() => {
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
      api.get(`/businesses/${selectedBiz.id}/schedules`)
    ]).then(([sRes, schRes]) => {
      setServices(sRes.data.data ?? sRes.data ?? []);
      setSchedules(schRes.data ?? []);
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

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/businesses', noBusinessForm);
      setBusinesses(prev => [...prev, res.data]);
      setSelectedBiz(res.data);
      showToast('✓ Negocio registrado exitosamente');
      // Refresh user info from server to reflect 'owner' role upgrade
      const meRes = await api.get('/users/me');
      localStorage.setItem('user', JSON.stringify(meRes.data));
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al crear negocio');
    } finally { setSubmitting(false); }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/businesses/${selectedBiz.id}/services`, serviceForm);
      setServices(prev => [...prev, res.data]);
      setServiceForm({ name: '', description: '', durationMinutes: 30, price: 0 });
      showToast('✓ Servicio agregado');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al crear servicio');
    } finally { setSubmitting(false); }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!selectedBiz || !confirm('¿Eliminar este servicio?')) return;
    try {
      await api.delete(`/businesses/${selectedBiz.id}/services/${serviceId}`);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      showToast('✓ Servicio eliminado');
    } catch { showToast('Error al eliminar'); }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz) return;
    setSubmitting(true);
    try {
      const dateBase = '2000-01-01';
      const res = await api.post(`/businesses/${selectedBiz.id}/schedules`, {
        dayOfWeek: scheduleForm.dayOfWeek,
        startTime: `${dateBase}T${scheduleForm.startTime}:00.000Z`,
        endTime: `${dateBase}T${scheduleForm.endTime}:00.000Z`,
      });
      setSchedules(prev => [...prev, res.data]);
      showToast('✓ Horario guardado');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al guardar horario');
    } finally { setSubmitting(false); }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!selectedBiz || !confirm('¿Eliminar este horario?')) return;
    try {
      await api.delete(`/businesses/${selectedBiz.id}/schedules/${scheduleId}`);
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      showToast('✓ Horario eliminado');
    } catch { showToast('Error al eliminar'); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz) return;
    setSubmitting(true);
    try {
      const res = await api.patch(`/businesses/${selectedBiz.id}`, settingsForm);
      setSelectedBiz(res.data);
      setBusinesses(prev => prev.map(b => b.id === res.data.id ? res.data : b));
      showToast('✓ Configuración guardada');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al guardar');
    } finally { setSubmitting(false); }
  };

  const TABS = [
    { id: 'agenda', icon: <CalendarDays size={16} />, label: 'Agenda Diaria' },
    { id: 'services', icon: <Briefcase size={16} />, label: 'Mis Servicios' },
    { id: 'schedules', icon: <Clock size={16} />, label: 'Horarios' },
    { id: 'settings', icon: <Settings size={16} />, label: 'Configurar' },
  ] as const;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '5rem', right: '1.5rem', zIndex: 2000, background: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', animation: 'slideUp 0.2s ease' }}>
          {toast}
        </div>
      )}

      {/* Header + selector de negocio */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-title)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '2px' }}>
            Panel de Administración
          </h1>
          <p className="text-muted text-sm">Bienvenido, <strong>{user?.name}</strong> — Rol: <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>Dueño</span></p>
        </div>

        {businesses.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Negocio activo:</label>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={selectedBiz?.id}
              onChange={e => setSelectedBiz(businesses.find(b => b.id === parseInt(e.target.value)) || null)}
            >
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Estado: sin negocios */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--text-title)' }}>Planilla de Reservas</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className="btn btn-light" style={{ padding: '6px 12px' }} onClick={() => setAgendaDate(d => subDays(d, 1))}>
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <input type="date" className="form-control" style={{ width: '155px', textAlign: 'center', fontWeight: 600 }}
                    value={format(agendaDate, 'yyyy-MM-dd')}
                    onChange={e => setAgendaDate(new Date(e.target.value + 'T12:00:00'))}
                  />
                  <button className="btn btn-light" style={{ padding: '6px 12px' }} onClick={() => setAgendaDate(d => addDays(d, 1))}>
                    Siguiente <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {agendaLoading ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>Cargando agenda...</p>
              ) : agendaAppointments.length === 0 ? (
                <div className="empty-state">
                  <p className="text-muted">No hay turnos para el {format(agendaDate, "d 'de' MMMM", { locale: es })}.</p>
                </div>
              ) : (
                <div className="timeline-container">
                  {agendaAppointments.map(apt => (
                    <div key={apt.id} className="timeline-item">
                      <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', fontSize: '1rem' }}>
                        {formatTime(apt.time)}
                      </div>
                      <div className="timeline-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontWeight: 700, marginBottom: '2px' }}>{apt.user?.name || 'Cliente'}</p>
                            <p className="text-muted text-sm">{apt.service?.name}</p>
                          </div>
                          <span className={`badge ${apt.status === 'CONFIRMED' ? 'badge-confirmed' : apt.status === 'CANCELLED' ? 'badge-cancelled' : 'badge-pending'}`}>
                            {STATUS_MAP[apt.status] || apt.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======= SERVICIOS ======= */}
          {activeTab === 'services' && (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
              <div className="ml-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-title)' }}>Agregar Servicio</h3>
                <form onSubmit={handleAddService}>
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input className="form-control" placeholder="Ej. Corte clásico" value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <textarea className="form-control" rows={2} value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Duración (min)</label>
                      <input type="number" className="form-control" value={serviceForm.durationMinutes} onChange={e => setServiceForm(f => ({ ...f, durationMinutes: parseInt(e.target.value) }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Precio ($)</label>
                      <input type="number" step="0.01" className="form-control" value={serviceForm.price} onChange={e => setServiceForm(f => ({ ...f, price: parseFloat(e.target.value) }))} required />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                    <Plus size={16} /> {submitting ? 'Guardando...' : 'Guardar Servicio'}
                  </button>
                </form>
              </div>

              <div className="ml-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-title)' }}>Servicios Configurados</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--background-app)', borderRadius: '8px' }}>
                        {['Servicio', 'Duración', 'Precio', 'Acciones'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {services.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay servicios registrados.</td></tr>
                      ) : services.map(svc => (
                        <tr key={svc.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <p style={{ fontWeight: 600 }}>{svc.name}</p>
                            <p className="text-muted text-xs">{svc.description}</p>
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-main)' }}>{svc.durationMinutes} min</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--status-success-text)' }}>${svc.price}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <button className="btn btn-light-danger" style={{ padding: '6px 10px' }} onClick={() => handleDeleteService(svc.id)}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======= HORARIOS ======= */}
          {activeTab === 'schedules' && (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
              <div className="ml-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-title)' }}>Definir Horario</h3>
                <form onSubmit={handleAddSchedule}>
                  <div className="form-group">
                    <label className="form-label">Día de la semana</label>
                    <select className="form-control" value={scheduleForm.dayOfWeek} onChange={e => setScheduleForm(f => ({ ...f, dayOfWeek: parseInt(e.target.value) }))}>
                      {DAY_NAMES.slice(1).map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Horario de apertura y cierre</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="time" className="form-control" value={scheduleForm.startTime} onChange={e => setScheduleForm(f => ({ ...f, startTime: e.target.value }))} required />
                      <input type="time" className="form-control" value={scheduleForm.endTime} onChange={e => setScheduleForm(f => ({ ...f, endTime: e.target.value }))} required />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                    <Plus size={16} /> Guardar Horario
                  </button>
                </form>
              </div>

              <div className="ml-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-title)' }}>Horarios Activos</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--background-app)' }}>
                      {['Día', 'Apertura', 'Cierre', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay horarios configurados.</td></tr>
                    ) : schedules.map(sch => (
                      <tr key={sch.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{DAY_NAMES[sch.dayOfWeek]}</td>
                        <td style={{ padding: '12px 14px' }}>{formatTime(sch.startTime)}</td>
                        <td style={{ padding: '12px 14px' }}>{formatTime(sch.endTime)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <button className="btn btn-light-danger" style={{ padding: '6px 10px' }} onClick={() => handleDeleteSchedule(sch.id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
