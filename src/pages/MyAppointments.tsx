import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Calendar as CalendarIcon, Clock, XCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  cancelledReason: string | null;
  service?: { name: string; durationMinutes: number; price: number; };
  business?: { name: string; address: string; };
}

type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING': return <span className="badge badge-pending">⏳ Pendiente</span>;
    case 'CONFIRMED': return <span className="badge badge-confirmed">✓ Confirmado</span>;
    case 'CANCELLED': return <span className="badge badge-cancelled">✗ Cancelado</span>;
    case 'COMPLETED': return <span className="badge badge-completed">★ Completado</span>;
    default: return <span className="badge badge-completed">{status}</span>;
  }
};

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'COMPLETED', label: 'Completados' },
  { value: 'CANCELLED', label: 'Cancelados' },
];

const MyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data ?? res.data ?? []);
    } catch { setAppointments([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const filtered = statusFilter === 'ALL' ? appointments : appointments.filter(a => a.status === statusFilter);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !cancelReason.trim()) return;
    setSubmitting(true);
    try {
      await api.patch(`/appointments/${selectedId}/cancel`, { reason: cancelReason });
      setCancelModalOpen(false);
      setCancelReason('');
      setSelectedId(null);
      fetchAppointments();
    } catch { alert('Ocurrió un error.'); }
    finally { setSubmitting(false); }
  };

  const openModal = (id: number) => { setSelectedId(id); setCancelModalOpen(true); };

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
  const formatDate = (dateStr: string) => {
    try { return format(new Date(dateStr), "d 'de' MMMM, yyyy", { locale: es }); } catch { return dateStr; }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-title)', fontSize: '1.75rem', fontWeight: 800 }}>Mis Turnos</h1>
          <p className="text-muted text-sm">{appointments.length} turno{appointments.length !== 1 ? 's' : ''} en total</p>
        </div>
      </div>

      {/* Filtros de estado */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: statusFilter === f.value ? 'var(--primary-color)' : 'var(--border-input)',
              background: statusFilter === f.value ? 'var(--status-pending-bg)' : 'white',
              color: statusFilter === f.value ? 'var(--primary-color)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-base)',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }} className="text-muted">Cargando tus turnos...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Info size={48} color="var(--text-disabled)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-title)', marginBottom: '0.5rem' }}>
            {statusFilter === 'ALL' ? 'No tienes turnos agendados' : `No tienes turnos ${FILTERS.find(f => f.value === statusFilter)?.label.toLowerCase()}`}
          </h3>
          <p className="text-muted text-sm">Explora los negocios disponibles y reserva tu primer turno.</p>
        </div>
      ) : (
        <div className="appointments-grid">
          {filtered.map(apt => (
            <div key={apt.id} className="ticket-card">
              <div className="ticket-body">
                {/* Header del ticket */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-title)', marginBottom: '2px' }}>
                      {apt.service?.name ?? 'Servicio'}
                    </h3>
                    <p className="text-muted text-sm">{apt.business?.name ?? 'Negocio'}</p>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>

                {/* Fecha y hora */}
                <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: 'var(--background-app)', borderRadius: '8px', marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.9rem' }}>
                    <CalendarIcon size={15} color="var(--primary-color)" />
                    {formatDate(apt.date)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.9rem' }}>
                    <Clock size={15} color="var(--primary-color)" />
                    {formatTime(apt.time)} hs
                  </div>
                </div>

                {apt.service?.durationMinutes && (
                  <p className="text-muted text-sm" style={{ marginBottom: '0' }}>
                    Duración: <strong>{apt.service.durationMinutes} min</strong>
                    {apt.service.price && <> · <strong style={{ color: 'var(--status-success-text)' }}>${apt.service.price}</strong></>}
                  </p>
                )}
              </div>

              <div className="ticket-divider" />

              <div className="ticket-footer">
                {apt.status === 'CANCELLED' && apt.cancelledReason && (
                  <div className="alert-danger" style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                    <strong>Motivo de cancelación:</strong> {apt.cancelledReason}
                  </div>
                )}

                {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                  <button
                    className="btn btn-light-danger"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => openModal(apt.id)}
                  >
                    <XCircle size={16} /> Cancelar Turno
                  </button>
                )}

                {(apt.status === 'COMPLETED' || apt.status === 'CANCELLED') && (
                  <p className="text-muted text-xs" style={{ textAlign: 'center' }}>
                    {apt.status === 'COMPLETED' ? '✓ Turno completado' : 'Turno cancelado'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de cancelación */}
      {cancelModalOpen && (
        <div className="modal-overlay" onClick={() => setCancelModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ color: 'var(--text-title)', fontWeight: 800, marginBottom: '0.5rem' }}>Cancelar Turno</h2>
            <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
              Por favor, indícanos el motivo de la cancelación. Esta acción no se puede deshacer.
            </p>
            <form onSubmit={handleCancel}>
              <div className="form-group">
                <label className="form-label">Motivo de cancelación (obligatorio)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Escribe el motivo aquí..."
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-light" style={{ flex: 1 }} onClick={() => setCancelModalOpen(false)}>
                  Volver
                </button>
                <button type="submit" className="btn btn-light-danger" style={{ flex: 1 }} disabled={submitting}>
                  <XCircle size={16} /> {submitting ? 'Cancelando...' : 'Confirmar cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
