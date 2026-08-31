import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Clock,
  DollarSign,
  CalendarCheck,
  ArrowLeft,
  MapPin,
  Phone,
  Star,
  MessageSquare,
  User,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Business {
  id: number;
  name: string;
  address: string;
  phone: string;
  description: string;
  category: string;
  rating?: number | null;
  reviewCount?: number;
}

interface Service {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
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

const INITIAL_REVIEWS_COUNT = 3;

const BusinessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsStats, setReviewsStats] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(INITIAL_REVIEWS_COUNT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, sRes, rRes] = await Promise.all([
          api.get(`/businesses/${id}`),
          api.get(`/businesses/${id}/services`),
          api.get(`/businesses/${id}/reviews`)
        ]);
        setBusiness(bRes.data);
        setServices(sRes.data.data ?? sRes.data ?? []);
        setReviews(rRes.data.data ?? []);
        setReviewsStats(rRes.data.stats ?? { average: 0, count: 0 });
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }} className="text-muted">Cargando...</div>;
  if (!business) return <div>Negocio no encontrado.</div>;

  const initials = business.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const visibleReviews = reviews.slice(0, visibleReviewsCount);
  const hasMoreReviews = reviews.length > visibleReviewsCount;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-light" style={{ marginBottom: '1.25rem', fontSize: '0.88rem' }}>
        <ArrowLeft size={16} /> Volver al catálogo
      </button>

      {/* Header del negocio */}
      <div className="ml-card" style={{ marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #009ee3, #0081bb)', height: '100px' }} />
        <div style={{ padding: '0 2rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.25rem', marginTop: '-2.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '16px',
              background: 'white', border: '3px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary-color)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ paddingBottom: '4px' }}>
              <h1 style={{ color: 'var(--text-title)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '2px' }}>{business.name}</h1>
              {business.category && <span className="badge badge-confirmed">{business.category}</span>}
            </div>

            {/* Valoración única en header */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--star-color)', fontWeight: 700, fontSize: '1.15rem' }}>
                <Star size={20} fill="currentColor" /> {reviewsStats.average > 0 ? reviewsStats.average.toFixed(1) : 'Nuevo'}
              </div>
              {reviewsStats.count > 0 && (
                <span className="text-muted text-sm" style={{ fontWeight: 500 }}>
                  ({reviewsStats.count} {reviewsStats.count === 1 ? 'opinión' : 'opiniones'})
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {business.address && (
              <p className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="var(--primary-color)" /> {business.address}
              </p>
            )}
            {business.phone && (
              <p className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} color="var(--primary-color)" /> {business.phone}
              </p>
            )}
          </div>

          {business.description && (
            <p style={{ marginTop: '0.75rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{business.description}</p>
          )}
        </div>
      </div>

      {/* Servicios Disponibles */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-title)', fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          Servicios Disponibles
        </h2>

        {services.length === 0 ? (
          <div className="empty-state">
            <p className="text-muted">Este local aún no tiene servicios publicados.</p>
          </div>
        ) : (
          <div className="services-grid">
            {services.map(svc => (
              <div key={svc.id} className="ml-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ color: 'var(--text-title)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                  {svc.name}
                </h3>
                <p className="text-muted text-sm" style={{ marginBottom: '1rem', flexGrow: 1, lineHeight: 1.5 }}>
                  {svc.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--background-app)', borderRadius: '8px', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                    <Clock size={15} color="var(--primary-color)" /> {svc.durationMinutes} min
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: 'var(--status-success-text)', fontSize: '1.05rem' }}>
                    <DollarSign size={15} />{svc.price}
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-full"
                  onClick={() => navigate(`/businesses/${id}/book?serviceId=${svc.id}`)}
                >
                  <CalendarCheck size={17} /> Reservar Turno
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección Permanente de Opiniones y Reseñas (Coincide con el ancho de arriba) */}
      <div className="ml-card" style={{ padding: '2rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ color: 'var(--text-title)', fontSize: '1.3rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={22} color="var(--primary-color)" /> Opiniones y Feedback
            </h2>
            <p className="text-muted text-xs" style={{ margin: '4px 0 0 0' }}>
              Experiencias compartidas por clientes verificados de {business.name}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-confirmed" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
              {reviewsStats.count} {reviewsStats.count === 1 ? 'opinión verificada' : 'opiniones verificadas'}
            </span>
          </div>
        </div>

        {/* Resumen de Calificación General */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-title)', lineHeight: 1 }}>
              {reviewsStats.average > 0 ? reviewsStats.average.toFixed(1) : '5.0'}
            </div>
            <div>
              <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={18}
                    fill={star <= Math.round(reviewsStats.average || 5) ? '#f59e0b' : 'none'}
                    color={star <= Math.round(reviewsStats.average || 5) ? '#f59e0b' : '#cbd5e1'}
                  />
                ))}
              </div>
              <p className="text-muted text-xs" style={{ margin: 0 }}>
                {reviewsStats.count > 0 ? `Puntuación promedio de clientes` : 'Aún sin calificaciones'}
              </p>
            </div>
          </div>

          <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 600 }}>
            {reviewsStats.average >= 4.5 ? '⭐ Excelente atención' : reviewsStats.average >= 3.5 ? '👍 Buena atención' : 'Servicio en crecimiento'}
          </div>
        </div>

        {/* Lista de Opiniones */}
        {reviews.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
            <MessageSquare size={40} color="var(--text-disabled)" style={{ marginBottom: '8px' }} />
            <p style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '4px' }}>Este negocio aún no tiene opiniones</p>
            <p className="text-muted text-xs">Sé el primero en reservar un turno y compartir tu experiencia.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {visibleReviews.map(rev => (
              <div
                key={rev.id}
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  background: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#e0f2fe',
                      color: 'var(--primary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      {rev.appointment?.user?.name ? rev.appointment.user.name[0].toUpperCase() : <User size={16} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--text-title)' }}>
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
                    <span className="text-muted text-xs">{formatDate(rev.createdAt)}</span>
                  </div>
                </div>

                {rev.comment ? (
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.5, background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontStyle: 'italic', borderLeft: '3px solid var(--primary-color)' }}>
                    "{rev.comment}"
                  </p>
                ) : (
                  <p className="text-muted text-xs" style={{ margin: '6px 0 0 0', fontStyle: 'italic' }}>
                    El cliente calificó con {rev.rating} estrellas sin comentario escrito.
                  </p>
                )}
              </div>
            ))}

            {/* Botón Ver Más Opiniones */}
            {hasMoreReviews && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  className="btn btn-light"
                  style={{
                    padding: '0.6rem 1.5rem',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => setVisibleReviewsCount(prev => prev + 3)}
                >
                  <ChevronDown size={16} /> Ver más opiniones ({reviews.length - visibleReviewsCount} restantes)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDetail;
