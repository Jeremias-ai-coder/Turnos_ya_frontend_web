import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  CalendarCheck, 
  AlertTriangle, 
  Clock, 
  CalendarPlus, 
  Info 
} from 'lucide-react';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  type AppNotification 
} from '../services/notification.service';
import { useAuth } from '../context/AuthContext';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diffSec < 60) return 'Hace un momento';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateString;
  }
}

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await getNotifications(20);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  // Carga inicial, Server-Sent Events (SSE en tiempo real instantáneo) y sincronización local
  useEffect(() => {
    if (!user?.id) return;
    const token = localStorage.getItem('token');
    fetchNotifications();

    let eventSource: EventSource | null = null;
    if (token) {
      try {
        // Conexión nativa de streaming SSE en tiempo real
        eventSource = new EventSource(`/api/v1/notifications/stream?token=${encodeURIComponent(token)}`);

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'NEW_NOTIFICATION') {
              // Agregar al inicio y actualizar contador sin latencia
              setNotifications(prev => [payload.notification, ...prev.filter(n => n.id !== payload.notification.id)]);
              setUnreadCount(payload.unreadCount);
            } else if (payload.type === 'UPDATE_UNREAD') {
              setNotifications(prev => prev.map(n => n.id === payload.readId ? { ...n, isRead: true } : n));
              setUnreadCount(payload.unreadCount);
            } else if (payload.type === 'ALL_READ') {
              setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
              setUnreadCount(0);
            }
          } catch {
            // Ignorar pings de heartbeat
          }
        };

        eventSource.onerror = () => {
          // El navegador reintenta la conexión automáticamente
        };
      } catch (err) {
        console.warn('[SSE] EventSource no disponible:', err);
      }
    }

    // Escuchar eventos locales de mutaciones inmediatas en frontend
    const handleLocalRefresh = () => {
      fetchNotifications();
    };
    window.addEventListener('notification-refresh', handleLocalRefresh);

    // Polling de respaldo de seguridad inteligente (60s) solo si la pestaña está activa
    const fallbackInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 60000);

    // Al volver a la pestaña de Turnos Ya, sincronizar estado
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (eventSource) eventSource.close();
      window.removeEventListener('notification-refresh', handleLocalRefresh);
      clearInterval(fallbackInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);

  const handleCloseDropdown = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 340);
  };

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen && !isClosing) {
          handleCloseDropdown();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isClosing]);

  const toggleDropdown = () => {
    if (isOpen) {
      handleCloseDropdown();
    } else {
      setIsOpen(true);
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    // Si no está leída, marcarla
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
      }
    }

    handleCloseDropdown();

    // Navegar al panel correspondiente según el rol
    if (user?.role === 'owner') {
      navigate('/dashboard');
    } else {
      navigate('/my-appointments');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_CONFIRMED':
        return (
          <div className="notification-icon-wrapper icon-confirmed">
            <CalendarCheck size={18} />
          </div>
        );
      case 'NEW_BOOKING':
        return (
          <div className="notification-icon-wrapper icon-booking">
            <CalendarPlus size={18} />
          </div>
        );
      case 'APPOINTMENT_CANCELLED':
        return (
          <div className="notification-icon-wrapper icon-cancelled">
            <AlertTriangle size={18} />
          </div>
        );
      case 'APPOINTMENT_REMINDER':
        return (
          <div className="notification-icon-wrapper icon-reminder">
            <Clock size={18} />
          </div>
        );
      default:
        return (
          <div className="notification-icon-wrapper icon-info">
            <Info size={18} />
          </div>
        );
    }
  };

  if (!user) return null;

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className={`notification-bell-btn ${isOpen ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={toggleDropdown}
        title="Notificaciones"
        aria-label="Ver notificaciones"
      >
        <Bell size={18} className="bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge" key={unreadCount}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {(isOpen || isClosing) && (
        <div className={`notification-dropdown ${isClosing ? 'is-closing' : 'is-entering'}`}>
          <div className="notification-header">
            <div className="notification-title-group">
              <span className="notification-title">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="notification-unread-pill">{unreadCount} nuevas</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button className="btn-mark-all-read" onClick={handleMarkAllRead}>
                <CheckCheck size={15} /> Marcar leídas
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  <Bell size={24} />
                </div>
                <p className="notification-empty-text">Sin notificaciones pendientes</p>
                <p className="notification-empty-subtext">
                  Te avisaremos sobre tus reservas y recordatorios aquí.
                </p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  {getNotificationIcon(notif.type)}
                  <div className="notification-body">
                    <h5 className="notification-item-title">{notif.title}</h5>
                    <p className="notification-item-msg">{notif.message}</p>
                    <span className="notification-item-time">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  {!notif.isRead && <span className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
