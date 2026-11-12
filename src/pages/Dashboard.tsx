import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  AlertCircle,
  Tags,
  Flag,
  MessageCircle,
  Heart,
  Sparkles,
  Bell
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
  const [searchParams] = useSearchParams();
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
  const [agendaViewMode, setAgendaViewMode] = useState<'day' | 'upcoming'>('day');
  const [agendaAppointments, setAgendaAppointments] = useState<Appointment[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);

  // Cancelación de turno por el comerciante
  const [aptToCancel, setAptToCancel] = useState<Appointment | null>(null);
  const [cancelAptReason, setCancelAptReason] = useState('');
  const [cancellingApt, setCancellingApt] = useState(false);

  // Registro de turno manual (presencial / telefónico)
  const [showManualAptModal, setShowManualAptModal] = useState(false);
  const [manualAptForm, setManualAptForm] = useState({
    serviceId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
  });
  const [manualBusySlots, setManualBusySlots] = useState<string[]>([]);
  const [submittingManualApt, setSubmittingManualApt] = useState(false);

  // Solicitud de moderación de reseña desde el panel del comerciante
  const [reportingReview, setReportingReview] = useState<Review | null>(null);
  const [reportReviewReason, setReportReviewReason] = useState('');
  const [submittingReviewReport, setSubmittingReviewReport] = useState(false);

  // Comunidad: Seguidores, Difusión de Promos/Avisos y Días Cerrados (Modo Feriado)
  const [communitySummary, setCommunitySummary] = useState<{
    followersCount: number;
    weeklyBroadcastsUsed: number;
    weeklyBroadcastsRemaining: number;
    closedDates: { id: number; closedDate: string; reason: string }[];
    recentBroadcasts: { id: number; type: string; title: string; message: string; sentCount: number; createdAt: string }[];
  }>({
    followersCount: 0,
    weeklyBroadcastsUsed: 0,
    weeklyBroadcastsRemaining: 3,
    closedDates: [],
    recentBroadcasts: [],
  });
  const [allBizAppointments, setAllBizAppointments] = useState<Appointment[]>([]);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState<{
    type: 'PROMO' | 'HOLIDAY' | 'SLOTS' | 'NEWS';
    title: string;
    message: string;
  }>({
    type: 'PROMO',
    title: '',
    message: '',
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const [closedDateForm, setClosedDateForm] = useState({
    closedDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    reason: 'Cerrado por Feriado',
    notifyFollowers: true,
  });
  const [savingClosedDate, setSavingClosedDate] = useState(false);

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
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    province: '',
    phone: '',
    email: '',
    category: '',
    logoUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    websiteUrl: '',
    googleMapsUrl: '',
    cuit: '',
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    'Peluquería', 'Estética', 'Salud', 'Deportes', 'Trámites', 'Mascotas', 'Gastronomía', 'Educación', 'Automotor', 'Otros'
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Solicitud de nuevo rubro vía ticket
  const [requestCategoryModalOpen, setRequestCategoryModalOpen] = useState(false);
  const [requestedCategoryName, setRequestedCategoryName] = useState('');
  const [requestedCategoryDesc, setRequestedCategoryDesc] = useState('');
  const [submittingCategoryRequest, setSubmittingCategoryRequest] = useState(false);

  const handleSendCategoryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedCategoryName.trim() || requestedCategoryName.trim().length < 2) return;
    setSubmittingCategoryRequest(true);
    try {
      await api.post('/reports', {
        section: 'SOLICITUD_RUBRO',
        summary: `Solicitud de nuevo rubro: ${requestedCategoryName.trim()}`,
        steps: `Nombre sugerido: ${requestedCategoryName.trim()}\nDescripción / Especialidad: ${requestedCategoryDesc.trim() || 'Sin descripción adicional'}\nSolicitado por el comercio "${selectedBiz?.name || 'Comercio'}"`,
        pageUrl: window.location.pathname,
      });
      showToast('✓ Solicitud de rubro enviada. El administrador revisará tu propuesta.');
      setRequestCategoryModalOpen(false);
      setRequestedCategoryName('');
      setRequestedCategoryDesc('');
    } catch {
      showToast('Error al enviar la solicitud');
    } finally {
      setSubmittingCategoryRequest(false);
    }
  };

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

  // Sincronizar pestaña y negocio desde parámetros de URL (ej. al hacer clic en una notificación)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['agenda', 'services', 'schedules', 'reviews', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    const bizParam = searchParams.get('biz');
    if (bizParam && businesses.length > 0) {
      const matched = businesses.find(b => b.name.toLowerCase() === bizParam.toLowerCase());
      if (matched) setSelectedBiz(matched);
    }
  }, [searchParams, businesses]);

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
      city: selectedBiz.city || '',
      province: selectedBiz.province || '',
      phone: selectedBiz.phone || '',
      email: selectedBiz.email || '',
      category: selectedBiz.category || '',
      logoUrl: selectedBiz.logoUrl || '',
      instagramUrl: selectedBiz.instagramUrl || '',
      facebookUrl: selectedBiz.facebookUrl || '',
      websiteUrl: selectedBiz.websiteUrl || '',
      googleMapsUrl: selectedBiz.googleMapsUrl || '',
      cuit: selectedBiz.cuit || '',
    });
    Promise.all([
      api.get(`/businesses/${selectedBiz.id}/services`),
      api.get(`/businesses/${selectedBiz.id}/schedules`),
      api.get(`/businesses/${selectedBiz.id}/reviews`),
      api.get(`/businesses/${selectedBiz.id}/community`).catch(() => null),
      api.get(`/appointments?businessId=${selectedBiz.id}&limit=100`).catch(() => null),
    ]).then(([sRes, schRes, rRes, commRes, allAptRes]) => {
      setServices(sRes.data.data ?? sRes.data ?? []);
      setSchedules(schRes.data ?? []);
      setReviews(rRes.data.data ?? []);
      setReviewsStats(rRes.data.stats ?? { average: 0, count: 0 });
      if (commRes?.data) {
        const cData = commRes.data?.data ?? commRes.data;
        setCommunitySummary({
          followersCount: Number(cData.followersCount || 0),
          weeklyBroadcastsUsed: Number(cData.weeklyBroadcastsUsed || 0),
          weeklyBroadcastsRemaining: typeof cData.weeklyBroadcastsRemaining === 'number' ? cData.weeklyBroadcastsRemaining : 3,
          closedDates: Array.isArray(cData.closedDates) ? cData.closedDates : [],
          recentBroadcasts: Array.isArray(cData.recentBroadcasts) ? cData.recentBroadcasts : [],
        });
      }
      if (allAptRes?.data) {
        const list = allAptRes.data?.data ?? allAptRes.data ?? [];
        setAllBizAppointments(Array.isArray(list) ? list : []);
      }
    });
  }, [selectedBiz]);

  const refreshCommunitySummary = async (bizId: number) => {
    try {
      const res = await api.get(`/businesses/${bizId}/community`);
      const cData = res.data?.data ?? res.data;
      if (cData) {
        setCommunitySummary({
          followersCount: Number(cData.followersCount || 0),
          weeklyBroadcastsUsed: Number(cData.weeklyBroadcastsUsed || 0),
          weeklyBroadcastsRemaining: typeof cData.weeklyBroadcastsRemaining === 'number' ? cData.weeklyBroadcastsRemaining : 3,
          closedDates: Array.isArray(cData.closedDates) ? cData.closedDates : [],
          recentBroadcasts: Array.isArray(cData.recentBroadcasts) ? cData.recentBroadcasts : [],
        });
      }
    } catch {
      /* ignore */
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz || !broadcastForm.title.trim() || !broadcastForm.message.trim()) return;
    setSendingBroadcast(true);
    try {
      const res = await api.post(`/businesses/${selectedBiz.id}/broadcasts`, broadcastForm);
      const sentCount = res.data?.data?.sentCount ?? 0;
      showToast(`✓ Aviso enviado con éxito a ${sentCount} ${sentCount === 1 ? 'seguidor' : 'seguidores'}`);
      setShowBroadcastModal(false);
      setBroadcastForm({ type: 'PROMO', title: '', message: '' });
      refreshCommunitySummary(selectedBiz.id);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.response?.data?.detail || 'No se pudo enviar el aviso');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleAddClosedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz || !closedDateForm.closedDate) return;
    setSavingClosedDate(true);
    try {
      await api.post(`/businesses/${selectedBiz.id}/closed-dates`, closedDateForm);
      showToast(
        closedDateForm.notifyFollowers
          ? '✓ Fecha bloqueada por feriado/cierre y seguidores notificados'
          : '✓ Fecha bloqueada en el calendario de reservas'
      );
      refreshCommunitySummary(selectedBiz.id);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al registrar día cerrado');
    } finally {
      setSavingClosedDate(false);
    }
  };

  const handleRemoveClosedDate = async (dateStr: string) => {
    if (!selectedBiz) return;
    try {
      await api.delete(`/businesses/${selectedBiz.id}/closed-dates/${dateStr}`);
      showToast('✓ Bloqueo de fecha eliminado. El día vuelve a estar habilitado.');
      refreshCommunitySummary(selectedBiz.id);
    } catch {
      showToast('Error al quitar bloqueo de fecha');
    }
  };

  // Load agenda
  const fetchAgendaAppointments = () => {
    if (!selectedBiz) return;
    setAgendaLoading(true);
    if (agendaViewMode === 'day') {
      const dateStr = format(agendaDate, 'yyyy-MM-dd');
      api.get(`/appointments?businessId=${selectedBiz.id}&date=${dateStr}&limit=50`)
        .then(res => {
          const list: Appointment[] = res.data.data ?? [];
          list.sort((a, b) => formatTime(a.time).localeCompare(formatTime(b.time)));
          setAgendaAppointments(list);
        })
        .catch(() => setAgendaAppointments([]))
        .finally(() => setAgendaLoading(false));
    } else {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      api.get(`/appointments?businessId=${selectedBiz.id}&limit=100`)
        .then(res => {
          const list: Appointment[] = (res.data.data ?? []).filter((a: Appointment) => {
            const dStr = typeof a.date === 'string' ? a.date.split('T')[0] : '';
            return dStr >= todayStr && (a.status === 'CONFIRMED' || a.status === 'PENDING');
          });
          list.sort((a, b) => {
            const dA = typeof a.date === 'string' ? a.date.split('T')[0] : '';
            const dB = typeof b.date === 'string' ? b.date.split('T')[0] : '';
            if (dA !== dB) return dA.localeCompare(dB);
            return formatTime(a.time).localeCompare(formatTime(b.time));
          });
          setAgendaAppointments(list);
        })
        .catch(() => setAgendaAppointments([]))
        .finally(() => setAgendaLoading(false));
    }
  };

  useEffect(() => {
    fetchAgendaAppointments();
  }, [selectedBiz, agendaDate, agendaViewMode]);

  // Load busy slots when manual appointment modal is open
  useEffect(() => {
    if (!showManualAptModal || !selectedBiz || !manualAptForm.date) return;
    api.get(`/businesses/${selectedBiz.id}/busy-slots?date=${manualAptForm.date}`)
      .then(res => {
        const raw: string[] = res.data?.data ?? res.data ?? [];
        setManualBusySlots(raw.map(s => formatTime(s)));
      })
      .catch(() => setManualBusySlots([]));
  }, [showManualAptModal, selectedBiz, manualAptForm.date]);

  const handleCancelAppointmentByOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptToCancel) return;
    setCancellingApt(true);
    try {
      await api.patch(`/appointments/${aptToCancel.id}/cancel`, {
        reason: cancelAptReason.trim() || 'Cancelado por el comercio por motivos operativos',
      });
      showToast('✓ Turno cancelado y cliente notificado');
      setAgendaAppointments(prev =>
        prev.map(a => (a.id === aptToCancel.id ? { ...a, status: 'CANCELLED' } : a))
      );
      setAptToCancel(null);
      setCancelAptReason('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al cancelar el turno');
    } finally {
      setCancellingApt(false);
    }
  };

  const handleCreateManualAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz || !manualAptForm.serviceId || !manualAptForm.date || !manualAptForm.time) return;
    setSubmittingManualApt(true);
    try {
      await api.post('/appointments', {
        businessId: selectedBiz.id,
        serviceId: Number(manualAptForm.serviceId),
        date: manualAptForm.date,
        time: manualAptForm.time,
      });
      showToast('✓ Turno manual registrado en la agenda');
      setShowManualAptModal(false);
      fetchAgendaAppointments();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'No se pudo registrar el turno manual');
    } finally {
      setSubmittingManualApt(false);
    }
  };

  const handleReportReviewFromDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReview || !reportReviewReason.trim() || !selectedBiz) return;
    setSubmittingReviewReport(true);
    try {
      await api.post('/reports', {
        section: 'MODERACION_RESENA',
        summary: `Reporte de reseña ID #${reportingReview.id} en ${selectedBiz.name}`,
        steps: `Motivo del reclamo: ${reportReviewReason.trim()}\nAutor de la reseña: ${reportingReview.appointment?.user?.name || 'Cliente'} (${reportingReview.rating} estrellas)\nComentario: "${reportingReview.comment || 'Sin texto'}"\nID Reseña: #${reportingReview.id}`,
        pageUrl: `/businesses/${selectedBiz.id}#reviews`,
      });
      showToast('✓ Solicitud de revisión enviada a moderación');
      setReportingReview(null);
      setReportReviewReason('');
    } catch {
      showToast('Error al enviar la solicitud de moderación');
    } finally {
      setSubmittingReviewReport(false);
    }
  };

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

            <div className="dashboard-hero-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="dashboard-broadcast-btn"
                onClick={() => setShowBroadcastModal(true)}
                style={{
                  padding: '7px 13px',
                  fontSize: '0.82rem',
                  gap: '6px',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #fff1f2, #fdf2f8)',
                  color: '#be123c',
                  border: '1.5px solid #fecdd3',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
                title="Enviar promoción, novedad o aviso de feriado a los clientes que siguen tu comercio"
              >
                <Sparkles size={14} color="#e11d48" />
                <span>Avisar a Seguidores ({communitySummary.followersCount})</span>
              </button>

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
              { icon: <Heart size={20} color="#e11d48" />, label: 'Seguidores', value: `${communitySummary.followersCount} ❤️` },
              { icon: <Briefcase size={20} />, label: 'Servicios', value: services.length },
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
              {/* Barra superior: Selector de vista (Por Día / Próximos) + Registrar Turno Manual */}
              <div className="dashboard-agenda-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setAgendaViewMode('day')}
                    style={{
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: agendaViewMode === 'day' ? '#ffffff' : 'transparent',
                      color: agendaViewMode === 'day' ? 'var(--primary-color)' : '#64748b',
                      boxShadow: agendaViewMode === 'day' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    📅 Por Día
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaViewMode('upcoming')}
                    style={{
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: agendaViewMode === 'upcoming' ? '#ffffff' : 'transparent',
                      color: agendaViewMode === 'upcoming' ? 'var(--primary-color)' : '#64748b',
                      boxShadow: agendaViewMode === 'upcoming' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    ⏳ Próximos Turnos
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (services.length === 0) {
                      showToast('Primero debés crear al menos un servicio en la pestaña Servicios');
                      setActiveTab('services');
                      return;
                    }
                    setManualAptForm({
                      serviceId: String(services[0]?.id || ''),
                      date: format(agendaDate, 'yyyy-MM-dd'),
                      time: '09:00',
                    });
                    setShowManualAptModal(true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.82rem', padding: '7px 14px', borderRadius: '8px' }}
                >
                  <Plus size={15} /> Registrar Turno Manual
                </button>
              </div>

              {agendaViewMode === 'day' ? (
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
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-title)' }}>
                      Próximas Reservas Activas
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      Todos los turnos confirmados o pendientes desde hoy en adelante, ordenados cronológicamente.
                    </p>
                  </div>
                  <span className="badge badge-confirmed" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                    {agendaAppointments.length} {agendaAppointments.length === 1 ? 'próximo turno' : 'próximos turnos'}
                  </span>
                </div>
              )}

              {agendaLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[1, 2, 3].map(n => (
                    <SkeletonTicket key={n} />
                  ))}
                </div>
              ) : agendaAppointments.length === 0 ? (
                <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                  <CalendarDays size={42} color="var(--text-disabled)" style={{ marginBottom: '0.75rem' }} />
                  <p style={{ fontWeight: 700, color: 'var(--text-title)', marginBottom: '4px', fontSize: '1rem' }}>
                    {agendaViewMode === 'day' ? 'Sin turnos para esta fecha' : 'No tenés próximos turnos agendados'}
                  </p>
                  <p className="text-muted text-sm" style={{ margin: 0 }}>
                    {agendaViewMode === 'day'
                      ? 'No hay clientes agendados para este día. Podés cambiar de fecha o ver "Próximos Turnos".'
                      : 'Cuando tus clientes reserven o registres un turno manual, aparecerán aquí.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {agendaAppointments.map(apt => {
                    const clientPhone = (apt.user as any)?.phone || '';
                    const cleanPhone = clientPhone.replace(/\D/g, '');
                    const aptDateFormatted = (() => {
                      try {
                        const dStr = typeof apt.date === 'string' ? apt.date.split('T')[0] : '';
                        return format(new Date(`${dStr}T12:00:00`), "EEE d 'de' MMM", { locale: es });
                      } catch {
                        return '';
                      }
                    })();

                    return (
                      <div
                        key={apt.id}
                        style={{
                          padding: '1rem',
                          border: '1px solid var(--border-default)',
                          borderRadius: '12px',
                          background: apt.status === 'COMPLETED' || apt.status === 'CANCELLED' ? '#f8fafc' : '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {agendaViewMode === 'upcoming' && aptDateFormatted && (
                              <span style={{
                                background: '#f1f5f9',
                                color: '#334155',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                textTransform: 'capitalize'
                              }}>
                                📅 {aptDateFormatted}
                              </span>
                            )}
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

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <div style={{
                              width: '38px', height: '38px', borderRadius: '50%',
                              background: '#f1f5f9', color: '#475569',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                            }}>
                              {apt.user?.name ? apt.user.name.charAt(0).toUpperCase() : <User size={16} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                                <p style={{ fontWeight: 700, color: 'var(--text-title)', margin: 0, fontSize: '0.92rem' }}>
                                  {apt.user?.name || 'Cliente'}
                                </p>
                                {(() => {
                                  const clientAppts = allBizAppointments.filter(
                                    a => (apt.userId && a.userId === apt.userId) || (apt.user?.email && a.user?.email === apt.user.email)
                                  );
                                  const completedVisits = clientAppts.filter(a => a.status === 'COMPLETED').length;
                                  const cancelledVisits = clientAppts.filter(a => a.status === 'CANCELLED').length;

                                  return (
                                    <>
                                      {completedVisits >= 2 ? (
                                        <span style={{
                                          fontSize: '0.69rem',
                                          fontWeight: 800,
                                          background: '#ecfdf5',
                                          color: '#047857',
                                          border: '1px solid #a7f3d0',
                                          borderRadius: '10px',
                                          padding: '1px 7px',
                                        }}>
                                          ⭐ Frecuente ({completedVisits} visitas)
                                        </span>
                                      ) : completedVisits === 1 ? (
                                        <span style={{
                                          fontSize: '0.69rem',
                                          fontWeight: 700,
                                          background: '#f0f9ff',
                                          color: '#0369a1',
                                          border: '1px solid #bae6fd',
                                          borderRadius: '10px',
                                          padding: '1px 7px',
                                        }}>
                                          ✓ 1 visita previa
                                        </span>
                                      ) : (
                                        <span style={{
                                          fontSize: '0.69rem',
                                          fontWeight: 700,
                                          background: '#eef2ff',
                                          color: '#4338ca',
                                          border: '1px solid #c7d2fe',
                                          borderRadius: '10px',
                                          padding: '1px 7px',
                                        }}>
                                          🆕 1° visita al local
                                        </span>
                                      )}
                                      {cancelledVisits >= 2 && (
                                        <span
                                          style={{
                                            fontSize: '0.69rem',
                                            fontWeight: 800,
                                            background: '#fff7ed',
                                            color: '#c2410c',
                                            border: '1px solid #fed7aa',
                                            borderRadius: '10px',
                                            padding: '1px 7px',
                                          }}
                                          title="Este usuario registra cancelaciones previas en tu comercio. Te sugerimos confirmar asistencia por WhatsApp."
                                        >
                                          ⚠️ {cancelledVisits} cancelaciones
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                              <p className="text-muted text-xs" style={{ margin: '0 0 2px 0', fontWeight: 600 }}>
                                {apt.service?.name || 'Servicio'} {apt.service?.durationMinutes ? `(${apt.service.durationMinutes} min)` : ''}
                              </p>
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.76rem', color: '#64748b' }}>
                                {apt.user?.email && <span>✉️ {apt.user.email}</span>}
                                {clientPhone && <span>📞 {clientPhone}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Acciones de contacto directo con el cliente */}
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                `Hola ${apt.user?.name || ''}, te escribimos de ${selectedBiz.name} por tu turno de "${apt.service?.name || 'servicio'}" a las ${formatTime(apt.time)} hs.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-light"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                textDecoration: 'none'
                              }}
                              title="Contactar cliente por WhatsApp"
                            >
                              <MessageCircle size={14} /> WhatsApp
                            </a>
                          )}
                        </div>

                        {(apt.status === 'CONFIRMED' || apt.status === 'PENDING') && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                            {apt.status === 'CONFIRMED' && (
                              <button
                                type="button"
                                className="btn btn-success-fill"
                                style={{ flex: 2, minWidth: '180px', padding: '0.5rem', fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '8px' }}
                                onClick={() => handleCompleteAppointment(apt.id)}
                              >
                                <Check size={15} /> Marcar como Completado
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-light"
                              style={{
                                flex: 1,
                                minWidth: '130px',
                                padding: '0.5rem',
                                fontSize: '0.82rem',
                                color: '#dc2626',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                fontWeight: 700,
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                              }}
                              onClick={() => {
                                setAptToCancel(apt);
                                setCancelAptReason('');
                              }}
                            >
                              <X size={14} /> Cancelar Turno
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
            <>
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

            {/* Panel de Modo Feriado / Días Cerrados Especiales */}
            <div className="ml-card dashboard-card-responsive" style={{ marginTop: '1.5rem', border: '1px solid #fde68a', background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 60%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontWeight: 800, margin: 0, color: '#92400e', fontSize: '1.12rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🏖️ Modo Feriado y Días Cerrados Especiales
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#b45309' }}>
                    Bloqueá fechas puntuales (feriados, vacaciones o reformas) sin borrar tus horarios habituales de la semana.
                  </p>
                </div>
                <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontWeight: 800, fontSize: '0.78rem', padding: '4px 10px', borderRadius: '12px' }}>
                  {communitySummary.closedDates.length} {communitySummary.closedDates.length === 1 ? 'fecha bloqueada' : 'fechas bloqueadas'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
                {/* Formulario para bloquear un día */}
                <form onSubmit={handleAddClosedDate} style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #fde68a' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Agendar Nuevo Cierre / Feriado
                  </h4>
                  <div className="form-grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Fecha a cerrar *</label>
                      <input
                        type="date"
                        className="form-control"
                        min={format(new Date(), 'yyyy-MM-dd')}
                        value={closedDateForm.closedDate}
                        onChange={e => setClosedDateForm(f => ({ ...f, closedDate: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Motivo del cierre *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: Feriado Nacional / Vacaciones"
                        value={closedDateForm.reason}
                        onChange={e => setClosedDateForm(f => ({ ...f, reason: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#334155', fontWeight: 600, cursor: 'pointer', marginBottom: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={closedDateForm.notifyFollowers}
                      onChange={e => setClosedDateForm(f => ({ ...f, notifyFollowers: e.target.checked }))}
                    />
                    <span>
                      🔔 Notificar automáticamente a mis <strong>{communitySummary.followersCount}</strong> seguidores sobre este cierre
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingClosedDate}
                    style={{ width: '100%', background: '#d97706', borderColor: '#d97706', fontWeight: 800 }}
                  >
                    {savingClosedDate ? 'Guardando cierre...' : '🏖️ Bloquear Fecha en Agenda'}
                  </button>
                </form>

                {/* Lista de fechas bloqueadas */}
                <div>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Próximos Días Cerrados Programados
                  </h4>
                  {communitySummary.closedDates.length === 0 ? (
                    <div style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '0.84rem', color: '#64748b' }}>
                      No tenés días feriados ni cierres especiales programados próximamente.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {communitySummary.closedDates.map(cd => (
                        <div
                          key={cd.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#ffffff',
                            border: '1px solid #fde68a',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            gap: '10px',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#92400e', textTransform: 'capitalize' }}>
                              📅 {(() => {
                                try {
                                  return format(new Date(`${cd.closedDate}T12:00:00`), "EEEE d 'de' MMMM, yyyy", { locale: es });
                                } catch {
                                  return cd.closedDate;
                                }
                              })()}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>
                              Motivo: {cd.reason}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-light-danger"
                            onClick={() => handleRemoveClosedDate(cd.closedDate)}
                            title="Reabrir fecha para turnos"
                            style={{ padding: '5px 10px', fontSize: '0.76rem', fontWeight: 700, flexShrink: 0 }}
                          >
                            <Trash2 size={13} /> Reabrir día
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            </>
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

                              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end' }}>
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star
                                      key={s}
                                      size={15}
                                      fill={s <= rev.rating ? '#f59e0b' : 'none'}
                                      color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'}
                                    />
                                  ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="text-muted text-xs">{formatDateReview(rev.createdAt)}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReportingReview(rev);
                                      setReportReviewReason('');
                                    }}
                                    style={{
                                      background: '#fff1f2',
                                      border: '1px solid #fecdd3',
                                      color: '#e11d48',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title="Solicitar revisión o moderación de este comentario al administrador"
                                  >
                                    <Flag size={11} /> Solicitar revisión
                                  </button>
                                </div>
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

          {/* ======= CONFIGURACIÓN (REDISEÑO SAAS PREMIUM EN GRID) ======= */}
          {activeTab === 'settings' && (
            <div className="dashboard-panel-grid" style={{ alignItems: 'start' }}>
              {/* Columna Principal: Formulario Estructurado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Header de Configuración con Avatar */}
                <div className="ml-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #009ee3 0%, #0284c7 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.4rem',
                      boxShadow: '0 4px 12px rgba(0, 158, 227, 0.25)'
                    }}>
                      {settingsForm.name?.charAt(0).toUpperCase() || <Building2 size={24} />}
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-title)' }}>
                        {settingsForm.name || 'Mi Comercio'}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span className="badge badge-confirmed" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                          {settingsForm.category || 'Sin categoría'}
                        </span>
                        <span className="text-muted text-xs">
                          ID Oficial #{selectedBiz.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/businesses/${selectedBiz.id}`}
                    target="_blank"
                    className="btn btn-outline-primary"
                    style={{ fontSize: '0.84rem', padding: '8px 14px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ExternalLink size={14} /> Ver perfil público ↗
                  </Link>
                </div>

                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Bloque 1: Identidad Comercial */}
                  <div className="ml-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-default)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-title)' }}>Identidad Comercial</h4>
                        <p className="text-muted text-xs" style={{ margin: 0 }}>Nombre, rubro principal y cómo presentás tu comercio</p>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700 }}>Nombre del Negocio *</label>
                      <input
                        className="form-control"
                        placeholder="Ej. Barbería Central, Centro de Estética..."
                        value={settingsForm.name}
                        onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700 }}>Categoría Principal *</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {availableCategories.map(cat => {
                          const isSelected = settingsForm.category === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSettingsForm(f => ({ ...f, category: cat }))}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '0.82rem',
                                fontWeight: isSelected ? 700 : 500,
                                border: isSelected ? '1.5px solid var(--primary-color)' : '1px solid var(--border-default)',
                                background: isSelected ? '#e0f2fe' : '#ffffff',
                                color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {isSelected ? `✓ ${cat}` : cat}
                            </button>
                          );
                        })}
                      </div>
                      <select
                        className="form-control"
                        value={settingsForm.category}
                        onChange={e => setSettingsForm(f => ({ ...f, category: e.target.value }))}
                        required
                      >
                        <option value="">O seleccionar de la lista completa...</option>
                        {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div style={{ marginTop: '6px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setRequestCategoryModalOpen(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0284c7',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0
                          }}
                        >
                          ¿No encuentras tu rubro? Solicitar nueva categoría
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>Descripción Comercial</label>
                        <span className="text-muted text-xs">{settingsForm.description.length}/500</span>
                      </div>
                      <textarea
                        className="form-control"
                        rows={3}
                        maxLength={500}
                        placeholder="Describe los servicios, especialidad, comodidades y propuesta de valor de tu negocio..."
                        value={settingsForm.description}
                        onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Bloque 2: Ubicación & Contacto Directo */}
                  <div className="ml-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-default)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-title)' }}>Ubicación & Contacto</h4>
                        <p className="text-muted text-xs" style={{ margin: 0 }}>Donde concurren tus clientes y tus canales directos de atención</p>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700 }}>Dirección Física *</label>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={16} color="var(--text-disabled)" style={{ position: 'absolute', left: 12, top: 12 }} />
                        <input
                          className="form-control"
                          style={{ paddingLeft: '36px' }}
                          placeholder="Ej. Av. Santa Fe 3250, Piso 1 Local 4"
                          value={settingsForm.address}
                          onChange={e => setSettingsForm(f => ({ ...f, address: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>Ciudad / Localidad</label>
                        <input
                          className="form-control"
                          placeholder="Ej. CABA, Crespo..."
                          value={settingsForm.city}
                          onChange={e => setSettingsForm(f => ({ ...f, city: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>Provincia</label>
                        <input
                          className="form-control"
                          placeholder="Ej. Buenos Aires, Entre Ríos"
                          value={settingsForm.province}
                          onChange={e => setSettingsForm(f => ({ ...f, province: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>Teléfono o WhatsApp *</label>
                        <div style={{ position: 'relative' }}>
                          <Phone size={16} color="var(--text-disabled)" style={{ position: 'absolute', left: 12, top: 12 }} />
                          <input
                            className="form-control"
                            style={{ paddingLeft: '36px' }}
                            placeholder="Ej. +54 9 11 2345-6789"
                            value={settingsForm.phone}
                            onChange={e => setSettingsForm(f => ({ ...f, phone: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>Email Comercial</label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={16} color="var(--text-disabled)" style={{ position: 'absolute', left: 12, top: 12 }} />
                          <input
                            type="email"
                            className="form-control"
                            style={{ paddingLeft: '36px' }}
                            placeholder="contacto@tunegocio.com"
                            value={settingsForm.email}
                            onChange={e => setSettingsForm(f => ({ ...f, email: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloque 3: Canales Digitales y Veracidad Oficial */}
                  <div className="ml-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-default)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Globe size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-title)' }}>Presencia Digital & Enlaces Oficiales</h4>
                        <p className="text-muted text-xs" style={{ margin: 0 }}>Redes y evidencias que dan confianza a clientes y administradores</p>
                      </div>
                    </div>

                    <div className="form-grid-2">
                      {/* Instagram */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label className="form-label" style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <InstagramIcon size={14} color="#e1306c" /> Instagram
                          </label>
                          {settingsForm.instagramUrl && (
                            <a href={settingsForm.instagramUrl.startsWith('http') ? settingsForm.instagramUrl : `https://${settingsForm.instagramUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: '#e1306c', fontWeight: 600 }}>
                              Probar link ↗
                            </a>
                          )}
                        </div>
                        <input
                          className="form-control"
                          placeholder="https://instagram.com/tu_comercio"
                          value={settingsForm.instagramUrl}
                          onChange={e => setSettingsForm(f => ({ ...f, instagramUrl: e.target.value }))}
                        />
                      </div>

                      {/* Facebook */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label className="form-label" style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FacebookIcon size={14} color="#1877f2" /> Facebook
                          </label>
                          {settingsForm.facebookUrl && (
                            <a href={settingsForm.facebookUrl.startsWith('http') ? settingsForm.facebookUrl : `https://${settingsForm.facebookUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: '#1877f2', fontWeight: 600 }}>
                              Probar link ↗
                            </a>
                          )}
                        </div>
                        <input
                          className="form-control"
                          placeholder="https://facebook.com/tu_negocio"
                          value={settingsForm.facebookUrl}
                          onChange={e => setSettingsForm(f => ({ ...f, facebookUrl: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      {/* Google Maps */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label className="form-label" style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} color="#dc2626" /> Google Maps
                          </label>
                          {settingsForm.googleMapsUrl && (
                            <a href={settingsForm.googleMapsUrl.startsWith('http') ? settingsForm.googleMapsUrl : `https://${settingsForm.googleMapsUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: '#dc2626', fontWeight: 600 }}>
                              Probar link ↗
                            </a>
                          )}
                        </div>
                        <input
                          className="form-control"
                          placeholder="https://maps.app.goo.gl/... o enlace de maps"
                          value={settingsForm.googleMapsUrl}
                          onChange={e => setSettingsForm(f => ({ ...f, googleMapsUrl: e.target.value }))}
                        />
                      </div>

                      {/* Sitio Web */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label className="form-label" style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Globe size={14} color="#0284c7" /> Sitio Web Oficial
                          </label>
                          {settingsForm.websiteUrl && (
                            <a href={settingsForm.websiteUrl.startsWith('http') ? settingsForm.websiteUrl : `https://${settingsForm.websiteUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: '#0284c7', fontWeight: 600 }}>
                              Probar link ↗
                            </a>
                          )}
                        </div>
                        <input
                          className="form-control"
                          placeholder="https://www.tucomercio.com"
                          value={settingsForm.websiteUrl}
                          onChange={e => setSettingsForm(f => ({ ...f, websiteUrl: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} color="#475569" /> CUIT Tributario (Opcional)
                      </label>
                      <input
                        className="form-control"
                        placeholder="Ej: 20-12345678-9 (sin guiones o con formato)"
                        value={settingsForm.cuit}
                        onChange={e => setSettingsForm(f => ({ ...f, cuit: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Barra de Acciones de Guardado */}
                  <div className="ml-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: '#fff' }}>
                    <p className="text-muted text-xs" style={{ margin: 0 }}>
                      Los cambios se sincronizan en vivo con tu ficha pública y la app mobile.
                    </p>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                      style={{ padding: '0.85rem 2rem', fontWeight: 800, borderRadius: '10px', boxShadow: '0 4px 14px rgba(0, 158, 227, 0.28)' }}
                    >
                      {submitting ? (
                        <LoadingSpinner size="sm" inline text="Guardando Cambios..." color="white" />
                      ) : (
                        <><Settings size={18} /> Guardar Configuración</>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Columna Lateral (Sidebar de Soporte, Estado & Visibilidad) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Tarjeta de Estado del Comercio */}
                <div className="ml-card" style={{ padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-title)' }}>
                    Estado del Local
                  </h4>
                  <div style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: selectedBiz.status === 'pending_approval' ? '#fef3c7' : selectedBiz.status === 'rejected' ? '#fee2e2' : '#e6f7ed',
                    border: `1px solid ${selectedBiz.status === 'pending_approval' ? '#fde68a' : selectedBiz.status === 'rejected' ? '#fecaca' : '#bbf7d0'}`,
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        color: selectedBiz.status === 'pending_approval' ? '#b45309' : selectedBiz.status === 'rejected' ? '#dc2626' : '#15803d'
                      }}>
                        {selectedBiz.status === 'pending_approval' ? '⏳ En Revisión Oficial' : selectedBiz.status === 'rejected' ? '✕ Observado por Auditoría' : '✓ Comercio Aprobado'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: selectedBiz.status === 'pending_approval' ? '#92400e' : selectedBiz.status === 'rejected' ? '#991b1b' : '#166534', lineHeight: 1.4 }}>
                      {selectedBiz.status === 'pending_approval'
                        ? 'Tu comercio está siendo auditado por el equipo de Turnos Ya. Podés editar los datos libremente.'
                        : selectedBiz.status === 'rejected'
                        ? `Motivo: ${selectedBiz.rejectionReason || 'Se requiere corregir las evidencias o dirección.'}`
                        : 'Tu comercio está activo y recibiendo turnos con normalidad.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowFichaModal(true)}
                    style={{ width: '100%', padding: '9px', fontSize: '0.84rem', fontWeight: 700, gap: '6px', borderRadius: '8px' }}
                  >
                    <Eye size={15} color="#0284c7" /> Ver Ficha Técnica Completa
                  </button>
                </div>

                {/* Checklist de Salud del Perfil */}
                <div className="ml-card" style={{ padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-title)' }}>
                    Completitud del Perfil
                  </h4>
                  {(() => {
                    const fields = [
                      settingsForm.name,
                      settingsForm.category,
                      settingsForm.description,
                      settingsForm.address,
                      settingsForm.city,
                      settingsForm.phone,
                      settingsForm.email,
                      settingsForm.instagramUrl || settingsForm.facebookUrl || settingsForm.websiteUrl,
                      settingsForm.cuit
                    ];
                    const count = fields.filter(f => Boolean(f && String(f).trim())).length;
                    const pct = Math.round((count / fields.length) * 100);
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span className="text-muted text-xs">Nivel de optimización</span>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: pct > 80 ? '#16a34a' : 'var(--primary-color)' }}>{pct}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? '#22c55e' : 'var(--primary-color)', transition: 'width 0.4s ease' }} />
                        </div>
                      </>
                    );
                  })()}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: settingsForm.description ? '#15803d' : 'var(--text-secondary)' }}>
                      <Check size={14} color={settingsForm.description ? '#22c55e' : 'var(--text-disabled)'} /> Descripción detallada
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: settingsForm.phone ? '#15803d' : 'var(--text-secondary)' }}>
                      <Check size={14} color={settingsForm.phone ? '#22c55e' : 'var(--text-disabled)'} /> WhatsApp de contacto
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: (settingsForm.instagramUrl || settingsForm.facebookUrl) ? '#15803d' : 'var(--text-secondary)' }}>
                      <Check size={14} color={(settingsForm.instagramUrl || settingsForm.facebookUrl) ? '#22c55e' : 'var(--text-disabled)'} /> Redes sociales vinculadas
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: settingsForm.cuit ? '#15803d' : 'var(--text-secondary)' }}>
                      <Check size={14} color={settingsForm.cuit ? '#22c55e' : 'var(--text-disabled)'} /> CUIT fiscal verificado
                    </div>
                  </div>
                </div>

                {/* Tip Pro de Posicionamiento */}
                <div style={{ padding: '1rem', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <AlertCircle size={18} color="#1d4ed8" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#1e40af', lineHeight: 1.4 }}>
                      <strong>Tip de visibilidad:</strong> Los negocios con dirección completa y enlace a Google Maps reciben hasta un 40% más de reservas confirmadas en la app mobile.
                    </p>
                  </div>
                </div>

              </div>
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
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span>{selectedBiz.category || 'General'}</span> • <span>ID #{selectedBiz.id}</span>
                    {selectedBiz.createdAt && (
                      <>
                        <span>•</span>
                        <span>📅 Creado el {format(new Date(selectedBiz.createdAt), "d 'de' MMMM, yyyy", { locale: es })}</span>
                      </>
                    )}
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

      {/* Modal de Solicitud de Nueva Categoría */}
      {requestCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => !submittingCategoryRequest && setRequestCategoryModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tags size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Solicitar Nuevo Rubro
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Envía una sugerencia al equipo de TurnosYa
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequestCategoryModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendCategoryRequest}>
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  Nombre sugerido del rubro *
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Ej: Tatuajes & Piercing, Veterinaria, Masajes..."
                  value={requestedCategoryName}
                  onChange={(e) => setRequestedCategoryName(e.target.value)}
                  style={{ height: '42px', borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  Descripción o qué servicios agrupa (opcional)
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Explica qué tipo de servicios ofrecerías bajo esta categoría..."
                  value={requestedCategoryDesc}
                  onChange={(e) => setRequestedCategoryDesc(e.target.value)}
                  style={{ borderRadius: '8px', fontSize: '0.86rem' }}
                />
              </div>

              <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={submittingCategoryRequest}
                  onClick={() => setRequestCategoryModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingCategoryRequest || !requestedCategoryName.trim()}
                  style={{ fontWeight: 700, padding: '10px 20px', borderRadius: '8px' }}
                >
                  {submittingCategoryRequest ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cancelación de Turno por el Comerciante */}
      {aptToCancel && (
        <div className="modal-overlay" onClick={() => !cancellingApt && setAptToCancel(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Cancelar Turno de {aptToCancel.user?.name || 'Cliente'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {aptToCancel.service?.name} · {formatTime(aptToCancel.time)} hs
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAptToCancel(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCancelAppointmentByOwner}>
              <p style={{ fontSize: '0.84rem', color: '#475569', margin: '0 0 12px' }}>
                El horario volverá a quedar libre en tu agenda y el cliente recibirá una notificación automática con el motivo indicado.
              </p>
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Motivo de la cancelación *
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  placeholder="Ej: Inconveniente operativo en el local, reprogramación acordada por WhatsApp..."
                  value={cancelAptReason}
                  onChange={(e) => setCancelAptReason(e.target.value)}
                  style={{ borderRadius: '8px', fontSize: '0.86rem' }}
                />
              </div>

              <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={cancellingApt}
                  onClick={() => setAptToCancel(null)}
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={cancellingApt || !cancelAptReason.trim()}
                  style={{ background: '#dc2626', borderColor: '#dc2626', fontWeight: 700, padding: '8px 18px', borderRadius: '8px' }}
                >
                  {cancellingApt ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Turno Manual (Presencial / Telefónico) */}
      {showManualAptModal && (
        <div className="modal-overlay" onClick={() => !submittingManualApt && setShowManualAptModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Registrar Turno Manual
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Bloqueá un horario para clientes presenciales o por teléfono
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualAptModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateManualAppointment}>
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Servicio a realizar *
                </label>
                <select
                  className="form-control"
                  required
                  value={manualAptForm.serviceId}
                  onChange={(e) => setManualAptForm(f => ({ ...f, serviceId: e.target.value }))}
                  style={{ height: '42px', borderRadius: '8px', fontSize: '0.88rem' }}
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes ?? 30} min · ${s.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Fecha del turno *
                </label>
                <input
                  type="date"
                  className="form-control"
                  required
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={manualAptForm.date}
                  onChange={(e) => setManualAptForm(f => ({ ...f, date: e.target.value }))}
                  style={{ height: '42px', borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Horario disponible (intervalos de 30 min) *
                </label>
                <select
                  className="form-control"
                  required
                  value={manualAptForm.time}
                  onChange={(e) => setManualAptForm(f => ({ ...f, time: e.target.value }))}
                  style={{ height: '42px', borderRadius: '8px', fontSize: '0.88rem' }}
                >
                  {Array.from({ length: 28 }, (_, i) => {
                    const totalMin = (8 * 60) + (i * 30);
                    const h = String(Math.floor(totalMin / 60)).padStart(2, '0');
                    const m = String(totalMin % 60).padStart(2, '0');
                    const slot = `${h}:${m}`;
                    const isBusy = manualBusySlots.includes(slot);
                    return (
                      <option key={slot} value={slot} disabled={isBusy}>
                        {slot} hs {isBusy ? '(Ocupado)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={submittingManualApt}
                  onClick={() => setShowManualAptModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingManualApt || manualBusySlots.includes(manualAptForm.time)}
                  style={{ fontWeight: 700, padding: '8px 18px', borderRadius: '8px' }}
                >
                  {submittingManualApt ? 'Guardando...' : 'Agendar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Solicitar Revisión de Reseña desde el Panel del Comerciante */}
      {reportingReview && (
        <div className="modal-overlay" onClick={() => !submittingReviewReport && setReportingReview(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flag size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Solicitar Revisión de Opinión
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Reseña #{reportingReview.id} de {reportingReview.appointment?.user?.name || 'Cliente'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportingReview(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReportReviewFromDashboard}>
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px', fontSize: '0.84rem', color: '#334155', fontStyle: 'italic' }}>
                "{reportingReview.comment || `Calificación de ${reportingReview.rating} estrellas sin texto.`}"
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  ¿Por qué solicitás la moderación de esta reseña? *
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  placeholder="Ej: Lenguaje ofensivo, spam, comentario falso o ajeno al servicio brindado..."
                  value={reportReviewReason}
                  onChange={(e) => setReportReviewReason(e.target.value)}
                  style={{ borderRadius: '8px', fontSize: '0.86rem' }}
                />
              </div>

              <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={submittingReviewReport}
                  onClick={() => setReportingReview(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingReviewReport || !reportReviewReason.trim()}
                  style={{ background: '#e11d48', borderColor: '#e11d48', fontWeight: 700, padding: '8px 18px', borderRadius: '8px' }}
                >
                  {submittingReviewReport ? 'Enviando...' : 'Enviar a Moderación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enviar Aviso / Promoción / Novedad a Seguidores del Comercio */}
      {showBroadcastModal && selectedBiz && (
        <div className="modal-overlay" onClick={() => !sendingBroadcast && setShowBroadcastModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Enviar Aviso a Seguidores
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Llegá directo a la campanita de tus {communitySummary.followersCount} seguidores en tiempo real
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              flexWrap: 'wrap',
              gap: '6px',
            }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>
                <Bell size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Política Anti-Spam (cuidamos a tus seguidores):
              </span>
              <span style={{
                fontWeight: 800,
                color: communitySummary.weeklyBroadcastsRemaining > 0 ? '#059669' : '#dc2626',
                background: communitySummary.weeklyBroadcastsRemaining > 0 ? '#ecfdf5' : '#fef2f2',
                padding: '2px 8px',
                borderRadius: '10px',
              }}>
                {communitySummary.weeklyBroadcastsRemaining} de 3 envíos disponibles esta semana
              </span>
            </div>

            <form onSubmit={handleSendBroadcast}>
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Tipo de comunicado *
                </label>
                <select
                  className="form-control"
                  value={broadcastForm.type}
                  onChange={e => setBroadcastForm(f => ({ ...f, type: e.target.value as any }))}
                  style={{ height: '42px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600 }}
                >
                  <option value="PROMO">🎁 Promoción o Descuento Especial</option>
                  <option value="SLOTS">⚡ Turnos Libres Hoy / Último Momento</option>
                  <option value="HOLIDAY">🏖️ Aviso de Feriado / Horario Especial</option>
                  <option value="NEWS">✨ Novedad o Nuevo Servicio en el Local</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Título corto del aviso *
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  maxLength={90}
                  placeholder="Ej: ¡20% OFF en Corte + Barba este Jueves!"
                  value={broadcastForm.title}
                  onChange={e => setBroadcastForm(f => ({ ...f, title: e.target.value }))}
                  style={{ height: '42px', borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Mensaje para tus seguidores *
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  maxLength={400}
                  placeholder="Contales los detalles de la promoción, los horarios disponibles o el motivo del aviso..."
                  value={broadcastForm.message}
                  onChange={e => setBroadcastForm(f => ({ ...f, message: e.target.value }))}
                  style={{ borderRadius: '8px', fontSize: '0.86rem' }}
                />
              </div>

              <div className="modal-footer-responsive" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={sendingBroadcast}
                  onClick={() => setShowBroadcastModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    sendingBroadcast ||
                    communitySummary.weeklyBroadcastsRemaining <= 0 ||
                    !broadcastForm.title.trim() ||
                    !broadcastForm.message.trim()
                  }
                  style={{ background: '#e11d48', borderColor: '#e11d48', fontWeight: 800, padding: '8px 18px', borderRadius: '8px' }}
                >
                  {sendingBroadcast ? 'Enviando aviso...' : '📢 Publicar y Notificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
