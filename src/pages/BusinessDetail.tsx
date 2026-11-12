import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { startSmoothNavigation } from '../utils/transitionNavigator';
import api, { cachedGet, clientCache } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
  Flag,
  X,
  CheckCircle2,
  Globe,
  MessageCircle,
  ExternalLink,
  Heart,
  Bell,
  BellOff,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SkeletonDetail } from '../components/common/SkeletonLoaders';
import { DefaultBusinessCover } from '../components/common/DefaultBusinessCover';
import { formatTimeToHHMM } from '../utils/timeHelper';
import { type Business, type BusinessService as Service } from '../types';

interface Review {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  isHidden?: boolean;
  hiddenReason?: string | null;
  appointment?: {
    user?: { id: number; name: string };
    service?: { id: number; name: string };
  };
}

const INITIAL_REVIEWS_COUNT = 3;
const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const BusinessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const previewBusiness: Business | null = location.state?.business || null;
  const cachedSvc = id ? clientCache.get<any>(`/businesses/${id}/services?{}`) : null;
  const initialServices: Service[] = Array.isArray(cachedSvc)
    ? cachedSvc
    : (Array.isArray(cachedSvc?.data) ? cachedSvc.data : (previewBusiness?.services || []));

  const cachedSch = id ? clientCache.get<any>(`/businesses/${id}/schedules?{}`) : null;
  const initialSchedules = Array.isArray(cachedSch) ? cachedSch : (Array.isArray(cachedSch?.data) ? cachedSch.data : []);

  const [business, setBusiness] = useState<Business | null>(previewBusiness);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [schedules, setSchedules] = useState<any[]>(initialSchedules);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsStats, setReviewsStats] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(INITIAL_REVIEWS_COUNT);
  const [loading, setLoading] = useState<boolean>(!previewBusiness);

  const { user } = useAuth();

  // Estado de Comunidad (Seguidores, Notificaciones, Feriados y Avisos del Comercio)
  const [community, setCommunity] = useState<{
    followersCount: number;
    isFollowing: boolean;
    receiveNotifications: boolean;
    closedDates: { id: number; closedDate: string; reason: string }[];
    recentBroadcasts: { id: number; type: string; title: string; message: string; sentCount: number; createdAt: string }[];
  }>({
    followersCount: 0,
    isFollowing: false,
    receiveNotifications: true,
    closedDates: [],
    recentBroadcasts: [],
  });
  const [togglingFollow, setTogglingFollow] = useState(false);

  const handleToggleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id || togglingFollow) return;
    setTogglingFollow(true);
    try {
      const res = await api.post(`/businesses/${id}/follow`);
      const data = res.data?.data ?? res.data;
      if (data) {
        setCommunity(prev => ({
          ...prev,
          isFollowing: Boolean(data.isFollowing),
          receiveNotifications: Boolean(data.receiveNotifications),
          followersCount: typeof data.followersCount === 'number' ? data.followersCount : prev.followersCount,
        }));
        showToast(
          data.isFollowing
            ? `❤️ Ahora seguís a ${business?.name || 'este comercio'}. Recibirás avisos de promos y feriados.`
            : `Dejaste de seguir a ${business?.name || 'este comercio'}`
        );
      }
    } catch {
      showToast('No se pudo actualizar el seguimiento');
    } finally {
      setTogglingFollow(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!user || !id || !community.isFollowing) return;
    const nextVal = !community.receiveNotifications;
    setCommunity(prev => ({ ...prev, receiveNotifications: nextVal }));
    try {
      await api.patch(`/businesses/${id}/follow/notifications`, {
        receiveNotifications: nextVal,
      });
      showToast(
        nextVal
          ? '🔔 Avisos de promociones y feriados activados'
          : '🔕 Avisos de este comercio silenciados (seguís teniéndolo en Favoritos)'
      );
    } catch {
      setCommunity(prev => ({ ...prev, receiveNotifications: !nextVal }));
      showToast('Error al cambiar preferencia de avisos');
    }
  };

  // Estados de Moderación In-Situ y Reportes
  const [reviewToReport, setReviewToReport] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState('Lenguaje ofensivo o difamatorio');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const [reviewToHide, setReviewToHide] = useState<Review | null>(null);
  const [hideReason, setHideReason] = useState('Incumple las normas de la comunidad');
  const [processingHide, setProcessingHide] = useState(false);

  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState(false);

  const [toast, setToast] = useState('');
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleUnhideReview = async (rev: Review) => {
    try {
      await api.patch(`/admin/reviews/${rev.id}/unhide`);
      setReviews((prev) => prev.map((r) => (r.id === rev.id ? { ...r, isHidden: false, hiddenReason: null } : r)));
      clientCache.clear();
      showToast('✓ Reseña restaurada a visibilidad pública');
    } catch {
      showToast('Error al desocultar reseña');
    }
  };

  const handleConfirmHideReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewToHide) return;
    setProcessingHide(true);
    try {
      await api.patch(`/admin/reviews/${reviewToHide.id}/hide`, { reason: hideReason });
      setReviews((prev) => prev.map((r) => (r.id === reviewToHide.id ? { ...r, isHidden: true, hiddenReason: hideReason } : r)));
      clientCache.clear();
      showToast('✓ Reseña ocultada de la vista pública');
      setReviewToHide(null);
    } catch {
      showToast('Error al ocultar reseña');
    } finally {
      setProcessingHide(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    setDeletingReview(true);
    try {
      await api.delete(`/admin/reviews/${reviewToDelete.id}`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete.id));
      clientCache.clear();
      showToast('✓ Reseña eliminada permanentemente');
      setReviewToDelete(null);
    } catch {
      showToast('Error al eliminar reseña');
    } finally {
      setDeletingReview(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewToReport) return;
    setSubmittingReport(true);
    try {
      await api.post('/reports', {
        section: 'MODERACION_RESENA',
        summary: `Reporte de reseña en ${business?.name || 'Comercio'} (ID #${reviewToReport.id})`,
        steps: `Motivo: ${reportReason}\nDetalles adicionales: ${reportDetails || 'Sin detalles adicionales'}\nComentario reportado: "${reviewToReport.comment || 'Calificación sin texto'}"\nCalificación: ${reviewToReport.rating} ⭐\nAutor: ${reviewToReport.appointment?.user?.name || 'Cliente'}`,
        pageUrl: window.location.pathname,
      });
      showToast('✓ Reporte enviado a moderación exitosamente');
      setReviewToReport(null);
      setReportDetails('');
    } catch {
      showToast('Error al enviar reporte');
    } finally {
      setSubmittingReport(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, sRes, rRes, schRes, commRes] = await Promise.all([
          cachedGet(`/businesses/${id}`, undefined, 180),
          cachedGet(`/businesses/${id}/services`, undefined, 180),
          cachedGet(`/businesses/${id}/reviews`, undefined, 60),
          cachedGet(`/businesses/${id}/schedules`, undefined, 180),
          api.get(`/businesses/${id}/community`).catch(() => null),
        ]);

        if (commRes?.data) {
          const cData = commRes.data?.data ?? commRes.data;
          if (cData && typeof cData === 'object') {
            setCommunity(prev => ({
              ...prev,
              followersCount: Number(cData.followersCount || 0),
              isFollowing: Boolean(cData.isFollowing),
              receiveNotifications: cData.receiveNotifications !== false,
              closedDates: Array.isArray(cData.closedDates) ? cData.closedDates : [],
              recentBroadcasts: Array.isArray(cData.recentBroadcasts) ? cData.recentBroadcasts : [],
            }));
          }
        }

        const loadedSchedules = Array.isArray(schRes) ? schRes : (Array.isArray(schRes?.data) ? schRes.data : []);
        setSchedules(loadedSchedules);

        const bData = bRes?.data ?? bRes;
        if (bData && typeof bData === 'object') {
          setBusiness(bData);
        }

        // Parsear servicios de forma robusta soportando array directo o envoltorio { data: [] }
        const sList: Service[] = Array.isArray(sRes)
          ? sRes
          : (Array.isArray(sRes?.data)
            ? sRes.data
            : (Array.isArray(bData?.services) ? bData.services : []));
        if (sList.length > 0 || !previewBusiness?.services?.length) {
          setServices(sList);
        }

        // Parsear reviews de forma robusta
        const rList: Review[] = Array.isArray(rRes)
          ? rRes
          : (Array.isArray(rRes?.data) ? rRes.data : []);
        setReviews(rList);

        const stats = rRes?.stats || (bData?.rating ? { average: Number(bData.rating), count: Number(bData.reviewCount || 0) } : { average: 0, count: 0 });
        setReviewsStats(stats);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading && !business) return <SkeletonDetail />;
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
      <button
        type="button"
        onClick={() => {
          const returnUrl = (location.state as any)?.from || '/';
          startSmoothNavigation(navigate, returnUrl, { direction: 'backward' });
        }}
        className="btn btn-light"
        style={{ marginBottom: '1.25rem', fontSize: '0.88rem' }}
      >
        <ArrowLeft size={16} /> Volver al catálogo
      </button>

      {/* Header del negocio con fondo de negocio por defecto */}
      <div className="ml-card" style={{ marginBottom: '2rem', overflow: 'hidden' }}>
        <DefaultBusinessCover size="banner" style={{ height: '130px' }} />
        <div style={{ padding: '0 clamp(1rem, 3.5vw, 2rem) 1.75rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '84px', height: '84px', borderRadius: '18px',
              background: 'white', border: '3.5px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.6rem', color: 'var(--primary-color)',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
              flexShrink: 0,
              marginTop: '-42px',
              position: 'relative',
              zIndex: 3,
            }}>
              {initials}
            </div>
            <div style={{ paddingTop: '0.6rem' }}>
              <h1 style={{ color: 'var(--text-title)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>{business.name}</h1>
              {business.category && <span className="badge badge-confirmed">{business.category}</span>}
            </div>

            {/* Valoración + Botón Seguir / Favorito en header */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '0.8rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--star-color)', fontWeight: 700, fontSize: '1.15rem' }}>
                  <Star size={20} fill="currentColor" /> {reviewsStats.average > 0 ? reviewsStats.average.toFixed(1) : 'Nuevo'}
                </div>
                {reviewsStats.count > 0 && (
                  <span className="text-muted text-sm" style={{ fontWeight: 500 }}>
                    ({reviewsStats.count} {reviewsStats.count === 1 ? 'opinión' : 'opiniones'})
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={togglingFollow}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '20px',
                    border: community.isFollowing ? '1.5px solid #e11d48' : '1.5px solid #fecdd3',
                    background: community.isFollowing ? '#fff1f2' : '#ffffff',
                    color: '#e11d48',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: togglingFollow ? 'wait' : 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: community.isFollowing ? '0 2px 8px rgba(225, 29, 72, 0.12)' : 'none',
                  }}
                  title={community.isFollowing ? 'Dejar de seguir este comercio' : 'Seguir comercio para guardarlo en favoritos y recibir avisos'}
                >
                  <Heart size={15} fill={community.isFollowing ? '#e11d48' : 'none'} color="#e11d48" />
                  <span>{community.isFollowing ? 'Siguiendo' : 'Seguir'}</span>
                  <span style={{
                    background: community.isFollowing ? '#e11d48' : '#ffe4e6',
                    color: community.isFollowing ? '#ffffff' : '#be123c',
                    padding: '1px 7px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                  }}>
                    {community.followersCount}
                  </span>
                </button>

                {community.isFollowing && (
                  <button
                    type="button"
                    onClick={handleToggleNotifications}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 11px',
                      borderRadius: '20px',
                      border: community.receiveNotifications ? '1px solid #bae6fd' : '1px solid #cbd5e1',
                      background: community.receiveNotifications ? '#f0f9ff' : '#f8fafc',
                      color: community.receiveNotifications ? '#0284c7' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                    }}
                    title={
                      community.receiveNotifications
                        ? 'Recibís notificaciones de promociones, feriados y turnos libres (clic para silenciar)'
                        : 'Notificaciones silenciadas (clic para activar avisos del comercio)'
                    }
                  >
                    {community.receiveNotifications ? <Bell size={13} /> : <BellOff size={13} />}
                    <span>{community.receiveNotifications ? 'Avisos activos' : 'Silenciado'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {(business.address || business.city) && (
              <p className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <MapPin size={14} color="var(--primary-color)" />
                {[business.address, business.city, business.province].filter(Boolean).join(', ')}
              </p>
            )}
            {business.phone && (
              <p className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Phone size={14} color="var(--primary-color)" /> {business.phone}
              </p>
            )}
          </div>

          {business.description && (
            <p style={{ marginTop: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              {business.description}
            </p>
          )}

          {/* Barra de Contacto Directo, Ubicación y Redes Sociales */}
          {(business.address || business.googleMapsUrl || business.phone || business.instagramUrl || business.facebookUrl || business.websiteUrl) && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
              {(business.googleMapsUrl || business.address) && (
                <a
                  href={
                    business.googleMapsUrl ||
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [business.name, business.address, business.city, business.province].filter(Boolean).join(', ')
                    )}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <MapPin size={13} /> Cómo llegar (Maps)
                </a>
              )}

              {business.phone && business.phone.replace(/\D/g, '').length >= 6 && (
                <a
                  href={`https://wa.me/${business.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hola ${business.name}, te escribo desde Turnos Ya para hacer una consulta.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <MessageCircle size={13} /> Consultar por WhatsApp
                </a>
              )}

              {business.instagramUrl && (
                <a
                  href={business.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: '#fff1f2',
                    color: '#e1306c',
                    border: '1px solid #fecdd3',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} /> Instagram
                </a>
              )}

              {business.facebookUrl && (
                <a
                  href={business.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: '#eff6ff',
                    color: '#1877f2',
                    border: '1px solid #bfdbfe',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} /> Facebook
                </a>
              )}

              {business.websiteUrl && (
                <a
                  href={business.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    border: '1px solid #bae6fd',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Globe size={13} /> Sitio Web
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cartelera de Avisos a la Comunidad y Próximos Feriados / Días Cerrados */}
      {(community.closedDates.length > 0 || community.recentBroadcasts.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {community.closedDates.length > 0 && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
                <AlertTriangle size={18} color="#d97706" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#92400e' }}>
                  Próximos Días Cerrados / Feriados
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {community.closedDates.slice(0, 4).map(cd => {
                  const dateFormatted = (() => {
                    try {
                      return format(new Date(`${cd.closedDate}T12:00:00`), "EEEE d 'de' MMMM", { locale: es });
                    } catch {
                      return cd.closedDate;
                    }
                  })();
                  return (
                    <div
                      key={cd.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#ffffff',
                        border: '1px solid #fef3c7',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.82rem',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <strong style={{ color: '#92400e', textTransform: 'capitalize' }}>🏖️ {dateFormatted}</strong>
                      <span style={{ color: '#b45309', fontWeight: 600 }}>{cd.reason}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {community.recentBroadcasts.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fdf2f8, #fff1f2)',
              border: '1px solid #fbcfe8',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#db2777" />
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#9d174d' }}>
                    Novedades y Promos del Comercio
                  </h3>
                </div>
                {!community.isFollowing && (
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #f472b6',
                      color: '#db2777',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Recibir avisos
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {community.recentBroadcasts.slice(0, 2).map(bc => (
                  <div
                    key={bc.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #fce7f3',
                      borderRadius: '8px',
                      padding: '8px 11px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '0.84rem', color: '#831843' }}>{bc.title}</strong>
                      <span style={{ fontSize: '0.71rem', color: '#9d174d', fontWeight: 600 }}>
                        {formatDate(bc.createdAt)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                      {bc.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Servicios Disponibles */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-title)', fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          Servicios Disponibles
        </h2>

        {loading && services.length === 0 ? (
          <div className="services-grid">
            {[1, 2, 3].map(n => (
              <div key={n} className="skeleton-box" style={{ height: '140px', borderRadius: '12px' }} />
            ))}
          </div>
        ) : services.length === 0 ? (
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
                  onClick={() => startSmoothNavigation(navigate, `/businesses/${id}/book?serviceId=${svc.id}`, { state: { business: { ...business, services }, service: svc, schedules } })}
                >
                  <CalendarCheck size={17} /> Reservar Turno
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      
      {/* Horarios de Atención del Comercio */}
      {schedules.length > 0 && (() => {
        const jsDay = new Date().getDay();
        const todayDayOfWeek = jsDay === 0 ? 7 : jsDay;
        const todaySchedules = schedules
          .filter((s: any) => s.dayOfWeek === todayDayOfWeek)
          .sort((a: any, b: any) => (a.startTime > b.startTime ? 1 : -1));

        const todayHoursSummary = todaySchedules
          .map((s: any) => `${formatTimeToHHMM(s.startTime)} a ${formatTimeToHHMM(s.endTime)}`)
          .reduce((acc: string, curr: string, i: number, arr: string[]) => {
            if (i === 0) return curr;
            if (i === arr.length - 1) return `${acc} y ${curr}`;
            return `${acc}, ${curr}`;
          }, '');

        return (
          <div className="ml-card" style={{ padding: 'clamp(1.2rem, 3.5vw, 1.75rem)', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--status-pending-bg)',
                  color: 'var(--primary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-title)', fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                    Horarios de Atención
                  </h3>
                  <p className="text-muted text-xs" style={{ margin: '2px 0 0 0' }}>
                    Días y franjas horarias de atención presencial
                  </p>
                </div>
              </div>

              {todaySchedules.length > 0 ? (
                <span className="badge badge-confirmed" style={{ fontSize: '0.82rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Abierto hoy ({todayHoursSummary} hs)
                </span>
              ) : (
                <span className="badge badge-cancelled" style={{ fontSize: '0.82rem', padding: '5px 10px' }}>
                  Cerrado hoy
                </span>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              background: 'var(--background-app)',
              padding: '12px',
              borderRadius: '12px'
            }}>
              {[1, 2, 3, 4, 5, 6, 7].map(d => {
                const daySchedules = schedules
                  .filter((s: any) => s.dayOfWeek === d)
                  .sort((a: any, b: any) => (a.startTime > b.startTime ? 1 : -1));
                const isTodayDay = d === todayDayOfWeek;
                return (
                  <div
                    key={d}
                    style={{
                      background: isTodayDay ? '#ffffff' : 'transparent',
                      border: isTodayDay ? '1.5px solid var(--primary-color)' : '1px solid transparent',
                      boxShadow: isTodayDay ? 'var(--shadow-sm)' : 'none',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: isTodayDay ? 800 : 600, color: isTodayDay ? 'var(--primary-text)' : 'var(--text-secondary)', marginBottom: '4px' }}>
                      {DAY_NAMES[d]} {isTodayDay && '•'}
                    </div>
                    {daySchedules.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {daySchedules.map((sch: any, idx: number) => (
                          <div key={idx} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-title)', whiteSpace: 'nowrap' }}>
                            {formatTimeToHHMM(sch.startTime)} - {formatTimeToHHMM(sch.endTime)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-disabled)' }}>
                        Cerrado
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Sección Permanente de Opiniones y Reseñas (Coincide con el ancho de arriba) */}
      <div className="ml-card" style={{ padding: 'clamp(1.2rem, 3.5vw, 2rem)', marginBottom: '3rem' }}>
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

                {/* Barra de Moderación In-Situ para Administradores */}
                {user?.role === 'administrator' && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        ⚙ Moderación:
                      </span>
                      {rev.isHidden ? (
                        <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '12px', padding: '2px 8px', fontSize: '0.74rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <EyeOff size={11} /> Oculta al público {rev.hiddenReason ? `(${rev.hiddenReason})` : ''}
                        </span>
                      ) : (
                        <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '2px 8px', fontSize: '0.74rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={11} /> Visible
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {rev.isHidden ? (
                        <button
                          type="button"
                          onClick={() => handleUnhideReview(rev)}
                          className="btn btn-sm btn-light"
                          style={{ padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669' }}
                          title="Restaurar a la vista pública"
                        >
                          <Eye size={12} />
                          <span>Desocultar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewToHide(rev);
                            setHideReason('Incumple las normas de la comunidad');
                          }}
                          className="btn btn-sm btn-light"
                          style={{ padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Ocultar opinión de la vista pública"
                        >
                          <EyeOff size={12} />
                          <span>Ocultar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setReviewToDelete(rev)}
                        className="btn btn-sm btn-light"
                        style={{ padding: '4px 10px', fontSize: '0.76rem', color: '#dc2626', background: '#fef2f2', borderColor: '#fecaca', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Eliminar reseña definitivamente"
                      >
                        <Trash2 size={12} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Botón Reportar para Dueño del Local o Clientes (si no es admin) */}
                {user && user.role !== 'administrator' && (
                  <div style={{ marginTop: '8px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewToReport(rev);
                        setReportReason('Lenguaje ofensivo o difamatorio');
                        setReportDetails('');
                      }}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.74rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px' }}
                      title="Reportar reseña inapropiada o falsa"
                    >
                      <Flag size={11} />
                      <span>Reportar opinión</span>
                    </button>
                  </div>
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

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toast}</span>
        </div>
      )}

      {/* Modal 1: Reportar Reseña (Dueño o Cliente) */}
      {reviewToReport && (
        <div className="modal-overlay" onClick={() => !submittingReport && setReviewToReport(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flag size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Reportar Opinión
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Se enviará una solicitud de revisión al equipo de moderación
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewToReport(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Resumen de la reseña reportada */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '1rem', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: 'var(--text-title)' }}>{reviewToReport.appointment?.user?.name || 'Cliente'}</strong>
                <span style={{ color: '#d97706', fontWeight: 700 }}>{reviewToReport.rating} ⭐</span>
              </div>
              <p style={{ margin: 0, color: '#475569', fontStyle: 'italic' }}>
                "{reviewToReport.comment || 'Calificación sin comentario escrito'}"
              </p>
            </div>

            <form onSubmit={handleSubmitReport}>
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  Motivo principal del reclamo *
                </label>
                <select
                  className="form-control"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                  style={{ height: '42px', borderRadius: '8px', fontSize: '0.88rem' }}
                >
                  <option value="Lenguaje ofensivo o difamatorio">Lenguaje ofensivo, insultos o difamación</option>
                  <option value="Spam o publicidad no deseada">Spam, publicidad o contenido no relacionado</option>
                  <option value="Reseña falsa o de la competencia">Reseña falsa (el usuario no fue cliente o es competidor)</option>
                  <option value="Información privada o datos sensibles">Revela datos privados o contacto personal</option>
                  <option value="Otro motivo">Otro motivo</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  Detalles adicionales (opcional)
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Explica brevemente por qué consideras que esta opinión debe ser moderada u oculta..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  style={{ borderRadius: '8px', fontSize: '0.86rem' }}
                />
              </div>

              <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={submittingReport}
                  onClick={() => setReviewToReport(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={submittingReport}
                  style={{ background: '#dc2626', borderColor: '#dc2626', fontWeight: 700, padding: '10px 20px', borderRadius: '8px' }}
                >
                  {submittingReport ? 'Enviando reporte...' : 'Enviar Reporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Ocultar Reseña con Motivo (Admin) */}
      {reviewToHide && (
        <div className="modal-overlay" onClick={() => !processingHide && setReviewToHide(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-drag-handle" />
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fff7ed', color: '#ea580c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <EyeOff size={24} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                Ocultar Opinión del Público
              </h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
                Esta opinión dejará de ser visible para los clientes y su puntuación se excluirá del promedio público del comercio. Podrás restaurarla en cualquier momento.
              </p>
            </div>

            <form onSubmit={handleConfirmHideReview}>
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Motivo de la moderación *
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={hideReason}
                  onChange={(e) => setHideReason(e.target.value)}
                  placeholder="Ej: Incumple normas de respeto / En revisión"
                  style={{ height: '40px', borderRadius: '8px', fontSize: '0.86rem' }}
                />
              </div>

              <div className="modal-footer-responsive" style={{ justifyContent: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={processingHide}
                  onClick={() => setReviewToHide(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-warning"
                  disabled={processingHide || !hideReason.trim()}
                  style={{ background: '#ea580c', color: 'white', border: 'none', fontWeight: 700, padding: '10px 20px', borderRadius: '8px' }}
                >
                  {processingHide ? 'Ocultando...' : 'Confirmar y Ocultar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Eliminar Reseña Definitivamente (Admin) */}
      {reviewToDelete && (
        <div className="modal-overlay" onClick={() => !deletingReview && setReviewToDelete(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center', padding: '1.5rem' }}>
            <div className="modal-drag-handle" />
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
              ¿Eliminar Opinión Permanentemente?
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
              Esta acción eliminará de forma irreversible el registro de esta reseña de la base de datos.
            </p>
            <div className="modal-footer-responsive" style={{ justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-light"
                disabled={deletingReview}
                onClick={() => setReviewToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deletingReview}
                onClick={handleDeleteReview}
                style={{ background: '#dc2626', borderColor: '#dc2626', fontWeight: 800, padding: '10px 20px', borderRadius: '8px' }}
              >
                {deletingReview ? 'Eliminando...' : '🗑 Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessDetail;
