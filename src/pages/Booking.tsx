import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Clock, DollarSign, ChevronLeft, ChevronRight, Check, ArrowLeft, MapPin } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isBefore, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

interface Business { id: number; name: string; address: string; description: string; }
interface Service { id: number; name: string; description: string; durationMinutes: number; price: number; }

type Step = 1 | 2 | 3;

const SLOT_TIMES_MORNING = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'];
const SLOT_TIMES_AFTERNOON = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];

const Booking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [step, setStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Hold state
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, sRes] = await Promise.all([api.get(`/businesses/${id}`), api.get(`/businesses/${id}/services`)]);
        setBusiness(bRes.data);
        setServices(sRes.data.data ?? sRes.data ?? []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    if (id) fetchData();
  }, [id]);

  // Countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (expiresAt) {
      timer = setInterval(() => {
        const diff = new Date(expiresAt).getTime() - Date.now();
        if (diff <= 0) {
          clearInterval(timer);
          setHoldToken(null); setExpiresAt(null); setTimeLeft(0);
          setError('El tiempo expiró. Por favor, selecciona un horario nuevamente.');
          setStep(2);
        } else { setTimeLeft(Math.ceil(diff / 1000)); }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [expiresAt]);

  // Calendar helpers
  const calendarDays = (() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  })();

  const isPast = (d: Date) => isBefore(d, new Date()) && !isToday(d);
  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
  const isOutOfMonth = (d: Date) => d.getMonth() !== currentMonth.getMonth();

  const handleHold = async () => {
    if (!selectedDate || !selectedTime || !selectedService) return;
    setSubmitting(true); setError('');
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await api.post('/appointments/hold', {
        businessId: Number(id),
        serviceId: selectedService.id,
        date: `${dateStr}T00:00:00.000Z`,
        time: `${dateStr}T${selectedTime}:00.000Z`,
      });
      setHoldToken(res.data.holdToken);
      setExpiresAt(res.data.expiresAt);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al reservar el horario.');
    } finally { setSubmitting(false); }
  };

  const handleConfirm = async () => {
    if (!holdToken || !selectedDate || !selectedTime || !selectedService) return;
    setSubmitting(true); setError('');
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await api.post('/appointments', {
        businessId: Number(id),
        serviceId: selectedService.id,
        date: `${dateStr}T00:00:00.000Z`,
        time: `${dateStr}T${selectedTime}:00.000Z`,
        holdToken,
      });
      navigate('/my-appointments');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al confirmar el turno.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }} className="text-muted">Cargando...</div>;
  if (!business) return <div>Negocio no encontrado</div>;

  const businessInitials = business.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-light" style={{ marginBottom: '1.25rem', fontSize: '0.88rem' }}>
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="wizard-card">
        {/* Sidebar Azul */}
        <div className="wizard-sidebar">
          <div>
            {/* Logo del negocio */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-color)', flexShrink: 0 }}>
                {businessInitials}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h5 style={{ fontWeight: 800, marginBottom: '2px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{business.name}</h5>
                {business.address && (
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {business.address}
                  </p>
                )}
              </div>
            </div>

            {selectedService && (
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '4px' }}>SERVICIO SELECCIONADO</p>
                <p style={{ color: 'white', fontWeight: 700 }}>{selectedService.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem' }}>{selectedService.durationMinutes} min · ${selectedService.price}</p>
              </div>
            )}

            {selectedDate && selectedTime && (
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '4px' }}>FECHA Y HORA</p>
                <p style={{ color: 'white', fontWeight: 700 }}>{format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}</p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem' }}>{selectedTime} hs</p>
              </div>
            )}
          </div>

          {/* Indicadores de pasos */}
          <div>
            {[
              { num: 1, label: 'Seleccionar Servicio' },
              { num: 2, label: 'Elegir Fecha y Hora' },
              { num: 3, label: 'Confirmación' },
            ].map(s => (
              <div key={s.num} className={`step-indicator-item ${step >= s.num ? 'active' : ''}`}>
                <div className="step-num">
                  {step > s.num ? <Check size={14} /> : s.num}
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contenido del wizard */}
        <div className="wizard-content">
          {error && <div className="alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

          {/* PASO 1: Servicios */}
          {step === 1 && (
            <>
              <h4 style={{ fontWeight: 800, color: 'var(--text-title)', marginBottom: '4px' }}>Elige un Servicio</h4>
              <p className="text-muted text-sm" style={{ marginBottom: '1.25rem' }}>Selecciona el tratamiento o servicio que deseas agendar.</p>
              <div className="services-wizard-grid">
                {services.map(svc => (
                  <div
                    key={svc.id}
                    className={`service-card-wizard ${selectedService?.id === svc.id ? 'selected' : ''}`}
                    onClick={() => setSelectedService(svc)}
                  >
                    <div className="checkmark"><Check size={12} /></div>
                    <h5 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px', color: 'var(--text-title)' }}>{svc.name}</h5>
                    <p className="text-muted text-xs" style={{ marginBottom: '10px', flexGrow: 1 }}>{svc.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {svc.durationMinutes} min
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--status-success-text)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <DollarSign size={14} />{svc.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '1.25rem' }}>
                <button
                  className="btn btn-primary btn-full"
                  disabled={!selectedService}
                  onClick={() => setStep(2)}
                  style={{ padding: '0.75rem' }}
                >
                  Continuar con fecha y hora
                </button>
              </div>
            </>
          )}

          {/* PASO 2: Calendario + Slots */}
          {step === 2 && (
            <>
              <h4 style={{ fontWeight: 800, color: 'var(--text-title)', marginBottom: '4px' }}>Fecha y Hora</h4>
              <p className="text-muted text-sm" style={{ marginBottom: '1.25rem' }}>Elige el día y selecciona un horario de atención disponible.</p>

              {/* Calendario mensual */}
              <div className="calendar-wrapper" style={{ marginBottom: '1.25rem' }}>
                <div className="calendar-header">
                  <button className="calendar-nav-btn" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                    <ChevronLeft size={16} />
                  </button>
                  <h6>{format(currentMonth, "MMMM yyyy", { locale: es })}</h6>
                  <button className="calendar-nav-btn" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="calendar-days-grid">
                  {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
                    <div key={d} className="calendar-day-name">{d}</div>
                  ))}
                  {calendarDays.map((day, i) => {
                    const outOfMonth = isOutOfMonth(day);
                    const past = isPast(day);
                    const weekend = isWeekend(day);
                    const todayDay = isToday(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isAvailable = !outOfMonth && !past && !weekend;
                    return (
                      <button
                        key={i}
                        className={`calendar-day-btn ${outOfMonth ? 'empty' : ''} ${isAvailable ? 'available' : ''} ${isSelected ? 'selected' : ''} ${todayDay ? 'today' : ''}`}
                        disabled={!isAvailable}
                        onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                        style={{ color: outOfMonth ? '#cbd5e1' : undefined }}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots de horarios */}
              {selectedDate && (
                <div>
                  <div style={{ marginBottom: '0.625rem' }}>
                    <p className="slots-section-title">☀ Mañana (09:00 – 13:00)</p>
                    <div className="slots-flex">
                      {SLOT_TIMES_MORNING.map(t => (
                        <button key={t} className={`btn-slot-pill ${selectedTime === t ? 'active' : ''}`} onClick={() => setSelectedTime(t)}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop: '0.875rem' }}>
                    <p className="slots-section-title">🌆 Tarde (13:00 – 18:00)</p>
                    <div className="slots-flex">
                      {SLOT_TIMES_AFTERNOON.map(t => (
                        <button key={t} className={`btn-slot-pill ${selectedTime === t ? 'active' : ''}`} onClick={() => setSelectedTime(t)}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', paddingTop: '1.25rem' }}>
                <button className="btn btn-light" onClick={() => setStep(1)}>
                  <ChevronLeft size={16} /> Cambiar servicio
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.75rem' }}
                  disabled={!selectedDate || !selectedTime || submitting}
                  onClick={handleHold}
                >
                  {submitting ? 'Reservando...' : 'Reservar este horario'}
                </button>
              </div>
            </>
          )}

          {/* PASO 3: Confirmación */}
          {step === 3 && selectedService && selectedDate && selectedTime && (
            <>
              <h4 style={{ fontWeight: 800, color: 'var(--text-title)', marginBottom: '4px' }}>Confirmar Reserva</h4>
              <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>Verifica los detalles de tu cita antes de confirmar.</p>

              {timeLeft > 0 && (
                <div className="alert-info" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                  ⏱ Horario reservado — Te quedan{' '}
                  <strong>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</strong> min para confirmar
                </div>
              )}

              <div className="receipt-container" style={{ marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{ color: 'var(--status-success-text)', marginBottom: '6px', fontSize: '2rem' }}>✓</div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detalles de la Reserva</p>
                </div>
                <div className="receipt-divider" />
                <div style={{ marginBottom: '0.875rem' }}>
                  <p className="text-sm text-muted fw-semibold">Servicio Seleccionado</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-title)' }}>{selectedService.name}</p>
                  {selectedService.description && <p className="text-sm text-muted">{selectedService.description}</p>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
                  <div>
                    <p className="text-xs text-muted fw-semibold">Fecha y Hora</p>
                    <p style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                      {format(selectedDate, "d MMM yyyy", { locale: es })} – {selectedTime} hs
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted fw-semibold">Duración</p>
                    <p style={{ fontWeight: 700 }}>{selectedService.durationMinutes} minutos</p>
                  </div>
                </div>
                <div className="receipt-divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="text-sm fw-semibold">Total a abonar</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-success-text)' }}>${selectedService.price}</p>
                </div>
              </div>

              <button
                className="btn btn-success-fill btn-full"
                style={{ padding: '0.875rem', fontSize: '1rem' }}
                disabled={submitting || timeLeft === 0}
                onClick={handleConfirm}
              >
                {submitting ? 'Confirmando...' : '✓ Confirmar Turno Definitivamente'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
