import React from 'react';

export interface BrandLogoProps {
  /**
   * 'white': For primary blue / dark headers (e.g. navbar #009ee3).
   * 'color': For light surfaces (Login, Register, Dashboard cards).
   */
  variant?: 'white' | 'color';
  /**
   * 'sm': Compact for small headers (fontSize ~20px)
   * 'md': Standard navbar (fontSize ~26px)
   * 'lg': Hero / auth screens (fontSize ~38px)
   */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'white',
  size = 'md',
  className = '',
  style,
}) => {
  const isWhite = variant === 'white';

  // Palette
  const textTurnosColor = isWhite ? '#ffffff' : '#0f172a';
  const badgeBg = isWhite ? '#ffffff' : '#009ee3';
  const badgeTextColor = isWhite ? '#009ee3' : '#ffffff';

  // Font and sizing scaling
  const fontSizes = {
    sm: 20,
    md: 27,
    lg: 38,
  };

  const fs = fontSizes[size];
  const badgeFs = Math.round(fs * 0.82);
  const badgePaddingY = Math.round(fs * 0.14);
  const badgePaddingX = Math.round(fs * 0.36);
  const badgeRadius = Math.round(fs * 0.28);
  const checkSize = Math.round(badgeFs * 0.72);

  return (
    <span
      className={`brand-logo-component brand-logo-${variant} brand-logo-${size} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? '6px' : size === 'lg' ? '10px' : '8px',
        userSelect: 'none',
        textDecoration: 'none',
        lineHeight: 1,
        fontFamily: "var(--font-family-base, 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif)",
        ...style,
      }}
    >
      {/* "Turnos" */}
      <span
        className="brand-logo-main"
        style={{
          fontSize: `${fs}px`,
          fontWeight: 800,
          letterSpacing: '-0.7px',
          color: textTurnosColor,
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        Turnos
      </span>

      {/* Speed-Badge "Ya ✓" */}
      <span
        className="brand-speed-badge"
        style={{
          background: badgeBg,
          color: badgeTextColor,
          fontSize: `${badgeFs}px`,
          fontWeight: 900,
          letterSpacing: '-0.2px',
          padding: `${badgePaddingY}px ${badgePaddingX}px`,
          borderRadius: `${badgeRadius}px`,
          display: 'inline-flex',
          alignItems: 'center',
          transform: 'skewX(-10deg)',
          boxShadow: isWhite
            ? '0 2px 8px rgba(0, 0, 0, 0.12)'
            : '0 3px 10px rgba(0, 158, 227, 0.25)',
          transition: 'all 0.2s ease',
          lineHeight: 1,
        }}
      >
        <span
          style={{
            transform: 'skewX(10deg)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          Ya
          {/* Crisp Checkmark */}
          <svg
            viewBox="0 0 24 24"
            width={checkSize}
            height={checkSize}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: 'block', marginLeft: '1px' }}
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      </span>
    </span>
  );
};
