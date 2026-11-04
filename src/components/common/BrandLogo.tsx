import React from 'react';

export interface BrandLogoProps {
  /**
   * 'white': 100% pure crisp white for primary blue/dark headers (#009ee3).
   * 'color': Dark slate (#0f172a) for Turnos/Calendar and vibrant cyan (#009ee3) for Ya/Arrow on white/light backgrounds.
   */
  variant?: 'white' | 'color';
  /**
   * 'sm': 28px icon, 1.15rem text (compact headers)
   * 'md': 34px icon, 1.35rem text (standard navbar)
   * 'lg': 44px icon, 1.7rem text (login/auth screens)
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to display the text 'Turnos Ya' alongside the isotype icon.
   */
  showText?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'white',
  size = 'md',
  showText = true,
  className = '',
  style,
}) => {
  const isWhite = variant === 'white';
  const mainStroke = isWhite ? '#ffffff' : '#0f172a';
  const accentColor = isWhite ? '#ffffff' : '#009ee3';
  const gridColor = isWhite ? 'rgba(255, 255, 255, 0.65)' : 'rgba(15, 23, 42, 0.2)';
  const bodyFill = isWhite ? 'rgba(255, 255, 255, 0.12)' : '#ffffff';

  const iconSizes = {
    sm: 28,
    md: 34,
    lg: 44,
  };

  const fontSizes = {
    sm: '1.15rem',
    md: '1.35rem',
    lg: '1.7rem',
  };

  const iconDim = iconSizes[size];

  return (
    <span
      className={`brand-logo-component brand-logo-${variant} brand-logo-${size} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? '7px' : size === 'lg' ? '12px' : '9px',
        userSelect: 'none',
        textDecoration: 'none',
        lineHeight: 1,
        ...style,
      }}
    >
      {/* Dynamic Vector Isotype */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width={iconDim}
        height={iconDim}
        fill="none"
        className="brand-logo-icon"
        style={{ flexShrink: 0, display: 'block' }}
        aria-hidden="true"
      >
        {/* Calendar Hanger Loops */}
        <rect x="27" y="6" width="9" height="18" rx="4.5" fill={mainStroke} />
        <rect x="64" y="6" width="9" height="18" rx="4.5" fill={mainStroke} />

        {/* Calendar Main Outer Shell */}
        <rect
          x="13"
          y="16"
          width="74"
          height="72"
          rx="16"
          fill={bodyFill}
          stroke={mainStroke}
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Header Bar Divider */}
        <line x1="16" y1="35" x2="84" y2="35" stroke={mainStroke} strokeWidth="5" strokeLinecap="round" />

        {/* Calendar Grid (Subtle, balanced) */}
        <line x1="37" y1="46" x2="37" y2="76" stroke={gridColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="63" y1="46" x2="63" y2="76" stroke={gridColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="23" y1="53" x2="77" y2="53" stroke={gridColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="23" y1="67" x2="52" y2="67" stroke={gridColor} strokeWidth="3" strokeLinecap="round" />

        {/* Speed Trails on Bottom-Left */}
        <path d="M5 74h10" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M2 81h14" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
        <path d="M6 88h10" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />

        {/* Dynamic Swoosh Body (smooth curve) */}
        <path
          d="M11 86C26 86 48 82 66 67C76 58 82 49 85 41"
          stroke={accentColor}
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Dynamic Arrowhead */}
        <path
          d="M72 38L93 34L87 55L82 45Z"
          fill={accentColor}
          stroke={accentColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>

      {/* Typography: Turnos Ya in a single horizontal line */}
      {showText && (
        <span
          className="brand-logo-text"
          style={{
            fontFamily: "var(--font-family-base, 'Plus Jakarta Sans', sans-serif)",
            fontSize: fontSizes[size],
            fontWeight: 800,
            letterSpacing: '-0.5px',
            lineHeight: 1,
            color: isWhite ? '#ffffff' : '#0f172a',
            whiteSpace: 'nowrap',
          }}
        >
          Turnos
          <span
            className="brand-logo-accent"
            style={{
              fontWeight: 900,
              color: isWhite ? '#ffffff' : '#009ee3',
              marginLeft: '2px',
            }}
          >
            Ya
          </span>
        </span>
      )}
    </span>
  );
};

