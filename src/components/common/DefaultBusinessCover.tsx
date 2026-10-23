import React from 'react';
import doodlePattern from '../../assets/patterns/turnos-doodle-pattern.svg';

interface DefaultBusinessCoverProps {
  name?: string;
  size?: 'card' | 'banner';
  className?: string;
  style?: React.CSSProperties;
}

export const DefaultBusinessCover: React.FC<DefaultBusinessCoverProps> = ({
  name = 'Negocio',
  size = 'card',
  className = '',
  style = {}
}) => {
  const initial = name?.trim()?.charAt(0).toUpperCase() || '?';

  if (size === 'banner') {
    return (
      <div
        className={`business-default-cover-banner ${className}`}
        style={{
          position: 'relative',
          height: '130px',
          background: 'linear-gradient(135deg, #0369a1 0%, #009ee3 55%, #38bdf8 100%)',
          overflow: 'hidden',
          ...style
        }}
      >
        {/* Patrón vectorial de garabatos de turnos (estilo WhatsApp) */}
        <div
          className="business-cover-pattern"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${doodlePattern})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '190px 190px',
            opacity: 0.16,
            pointerEvents: 'none',
          }}
        />
        {/* Iluminación / Viñeta suave */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.15) 0%, rgba(2, 132, 199, 0.15) 50%, rgba(3, 105, 161, 0.45) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`business-default-cover ${className}`}
      style={{
        position: 'relative',
        height: '120px',
        background: 'linear-gradient(135deg, #0369a1 0%, #009ee3 55%, #38bdf8 100%)',
        borderTopLeftRadius: '13px',
        borderTopRightRadius: '13px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      {/* Patrón vectorial de garabatos de turnos (estilo WhatsApp) */}
      <div
        className="business-cover-pattern"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${doodlePattern})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '180px 180px',
          opacity: 0.16,
          pointerEvents: 'none',
        }}
      />

      {/* Iluminación radial suave para profundidad visual */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.18) 0%, rgba(2, 132, 199, 0.2) 60%, rgba(3, 105, 161, 0.5) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Avatar flotante con inicial del negocio */}
      <div
        className="business-cover-avatar"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '66px',
          height: '66px',
          borderRadius: '16px',
          background: '#ffffff',
          color: 'var(--primary-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '1.45rem',
          border: '3px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 8px 20px -2px rgba(15, 23, 42, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08)',
          userSelect: 'none',
        }}
      >
        {initial}
      </div>
    </div>
  );
};

export default DefaultBusinessCover;
