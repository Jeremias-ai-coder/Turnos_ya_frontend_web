import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Calendar as CalendarIcon, Clock, XCircle, Info, Star, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTimeToHHMM, getHoursUntilAppointment } from '../utils/timeHelper';

interface Review {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  cancelledReason: string | null;
  service?: { name: string; durationMinutes: number; price: number; minCancellationNoticeHours?: number };
  business?: { name: string; address: string; };
  review?: Review | null;
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

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewApt, setReviewApt] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data ?? res.data ?? []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filtered = statusFilter === 'ALL' ? appointments : appointments.filter(a => a.status === statusFilter);

  const getHoursUntil = (dateStr: string, timeStr: string) => {
    return getHoursUntilAppointment(dateStr, timeStr);
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !cancelReason.trim()) return;
    setSubmitting(true);
    setCancelError('');
    try {
      await api.patch(`/appointments/${selectedId}/cancel`, { reason: cancelReason });
      setCancelModalOpen(false);
      setCancelReason('');
      setSelectedId(null);
      fetchAppointments();
    } catch (err: any) {
      setCancelError(err.response?.data?.message || err.response?.data?.detail || 'No se pudo cancelar el turno.');
    } finally {
      setSubmitting(false);
    }
  };

  const openCancelModal = (id: number) => {
    setSelectedId(id);
    setCancelReason('');
    setCancelError('');
    setCancelModalOpen(true);
  };

  const openReviewModal = (apt: Appointment) => {
    setReviewApt(apt);
    setRating(5);
    setComment('');
    setReviewError('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewApt) return;
    setReviewSubmitting(true);
    setReviewError('');
    try {
      await api.post(`/appointments/${reviewApt.id}/reviews`, {
        rating,
        comment: comment.trim() ? comment.trim() : null
      });
      setReviewModalOpen(false);
      setReviewApt(null);
      fetchAppointments();
    } catch (err: any) {
      setReviewError(err.response?.data?.message || err.response?.data?.detail || 'Error al guardar la reseña.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatTime = (timeStr: string) => {
    return formatTimeToHHMM(timeStr);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    try {
      const cleanDate = dateStr.split('T')[0];
      const [year, month, day] = cleanDate.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return format(localDate, "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateStr;
    }
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
          {filtered.map(apt => {
            const hoursUntil = getHoursUntil(apt.date, apt.time);
            const noticeHours = apt.service?.minCancellationNoticeHours ?? 24;
            const canCancel = (apt.status === 'PENDING' || apt.status === 'CONFIRMED') && hoursUntil >= noticeHours;

            return (
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
                  {/* Info de cancelación */}
                  {apt.status === 'CANCELLED' && apt.cancelledReason && (
                    <div className="alert-danger" style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                      <strong>Motivo:</strong> {apt.cancelledReason}
                    </div>
                  )}

                  {/* Botón de Cancelar o Aviso de Anticipación */}
                  {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                    canCancel ? (
                      <button
                        className="btn btn-light-danger"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => openCancelModal(apt.id)}
                      >
                        <XCircle size={16} /> Cancelar Turno
                      </button>
                    ) : (
                      <div style={{
                        padding: '8px 12px',
                        background: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        justifyContent: 'center',
                        fontWeight: 600
                      }}>
                        <AlertTriangle size={14} />
                        Cancelable hasta 24hs antes
                      </div>
                    )
                  )}

                  {/* Feedback / Reseña en turnos completados */}
                  {apt.status === 'COMPLETED' && (
                    apt.review ? (
                      <div style={{
                        padding: '10px',
                        background: 'var(--background-app)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-default)',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>
                          <Star size={16} fill="#f59e0b" color="#f59e0b" />
                          <span>Tu Calificación: {apt.review.rating} / 5</span>
                        </div>
                        {apt.review.comment && (
                          <p className="text-muted text-xs" style={{ marginTop: '4px', fontStyle: 'italic', marginBottom: 0 }}>
                            "{apt.review.comment}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', background: '#f59e0b', borderColor: '#d97706', color: 'white' }}
                        onClick={() => openReviewModal(apt)}
                      >
                        <Star size={16} fill="white" /> Calificar Atención
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cancelación */}
      {cancelModalOpen && (
        <div className="modal-overlay" onClick={() => setCancelModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ color: 'var(--text-title)', fontWeight: 800, marginBottom: '0.5rem' }}>Cancelar Turno</h2>
            <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
              Recuerda que solo se pueden cancelar turnos con al menos 24 horas de anticipación.
            </p>

            {cancelError && (
              <div className="alert-danger" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                {cancelError}
              </div>
            )}

            <form onSubmit={handleCancel}>
              <div className="form-group">
                <label className="form-label">Motivo de cancelación (obligatorio)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Explica brevemente el motivo..."
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

      {/* Modal de Dejar Reseña / Feedback */}
      {reviewModalOpen && reviewApt && (
        <div className="modal-overlay" onClick={() => setReviewModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ color: 'var(--text-title)', fontWeight: 800, marginBottom: '0.5rem' }}>Calificar Atención</h2>
            <p className="text-muted text-sm" style={{ marginBottom: '1.25rem' }}>
              ¿Cómo fue tu experiencia con <strong>{reviewApt.service?.name}</strong> en <strong>{reviewApt.business?.name}</strong>?
            </p>

            {reviewError && (
              <div className="alert-danger" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                {reviewError}
              </div>
            )}

            <form onSubmit={handleReviewSubmit}>
              {/* Estrellas interactivas */}
              <div className="form-group" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Puntuación</label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => {
                    const active = (hoverRating !== null ? hoverRating : rating) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          transition: 'transform 0.15s'
                        }}
                      >
                        <Star
                          size={32}
                          color={active ? '#f59e0b' : '#d1d5db'}
                          fill={active ? '#f59e0b' : 'none'}
                        />
                      </button>
                    );
                  })}
                </div>
                <p style={{ marginTop: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#f59e0b' }}>
                  {rating === 1 && '⭐ Malo'}
                  {rating === 2 && '⭐⭐ Regular'}
                  {rating === 3 && '⭐⭐⭐ Bueno'}
                  {rating === 4 && '⭐⭐⭐⭐ Muy Bueno'}
                  {rating === 5 && '⭐⭐⭐⭐⭐ ¡Excelente!'}
                </p>
              </div>

              {/* Comentario opcional */}
              <div className="form-group">
                <label className="form-label">Comentario (opcional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Cuéntanos más detalles sobre el servicio recibido..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-light" style={{ flex: 1 }} onClick={() => setReviewModalOpen(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#f59e0b', borderColor: '#d97706' }}
                  disabled={reviewSubmitting}
                >
                  <CheckCircle size={16} /> {reviewSubmitting ? 'Enviando...' : 'Publicar Reseña'}
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
