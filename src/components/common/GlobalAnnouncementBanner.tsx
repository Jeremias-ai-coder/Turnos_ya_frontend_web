import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Info, AlertTriangle, AlertOctagon, CheckCircle, X, ExternalLink } from 'lucide-react';
import api from '../../services/api';

interface SystemAnnouncement {
  id: number;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  isActive: boolean;
  linkUrl?: string | null;
  linkText?: string | null;
  expiresAt?: string | null;
}

export const GlobalAnnouncementBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchActiveAnnouncement = async () => {
      try {
        const res = await api.get('/announcements/active');
        const data = res.data?.data;
        if (!isMounted) return;

        if (data && data.id) {
          const isDismissed = sessionStorage.getItem(`dismissed_announcement_${data.id}`);
          if (!isDismissed) {
            setAnnouncement(data);
          }
        }
      } catch {
        // Silencioso en caso de error de red
      }
    };

    fetchActiveAnnouncement();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!announcement || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(`dismissed_announcement_${announcement.id}`, 'true');
  };

  const config = {
    info: {
      bg: 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)',
      border: '#bfdbfe',
      text: '#1e40af',
      linkText: '#1d4ed8',
      icon: <Info size={16} color="#2563eb" style={{ flexShrink: 0 }} />
    },
    warning: {
      bg: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
      border: '#fde68a',
      text: '#92400e',
      linkText: '#b45309',
      icon: <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
    },
    danger: {
      bg: 'linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)',
      border: '#fecaca',
      text: '#991b1b',
      linkText: '#b91c1c',
      icon: <AlertOctagon size={16} color="#dc2626" style={{ flexShrink: 0 }} />
    },
    success: {
      bg: 'linear-gradient(90deg, #ecfdf5 0%, #d1fae5 100%)',
      border: '#a7f3d0',
      text: '#065f46',
      linkText: '#047857',
      icon: <CheckCircle size={16} color="#059669" style={{ flexShrink: 0 }} />
    }
  }[announcement.type || 'info'];

  const isExternal = announcement.linkUrl?.startsWith('http://') || announcement.linkUrl?.startsWith('https://');

  return (
    <div
      role="region"
      aria-label="Aviso del sistema"
      style={{
        background: config.bg,
        borderBottom: `1px solid ${config.border}`,
        padding: '0.65rem 2.5rem 0.65rem 1rem',
        color: config.text,
        fontSize: '0.88rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        position: 'relative',
        zIndex: 35,
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {config.icon}
        <span style={{ fontWeight: 500 }}>{announcement.message}</span>
        {announcement.linkUrl && (
          isExternal ? (
            <a
              href={announcement.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: config.linkText,
                fontWeight: 700,
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                marginLeft: '4px'
              }}
            >
              {announcement.linkText || 'Más información'} <ExternalLink size={12} />
            </a>
          ) : (
            <Link
              to={announcement.linkUrl}
              style={{
                color: config.linkText,
                fontWeight: 700,
                textDecoration: 'underline',
                marginLeft: '4px'
              }}
            >
              {announcement.linkText || 'Ver más →'}
            </Link>
          )
        )}
      </div>
      <button
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: config.linkText,
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          opacity: 0.8,
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
        title="Ocultar aviso"
        aria-label="Ocultar aviso"
      >
        <X size={16} />
      </button>
    </div>
  );
};

