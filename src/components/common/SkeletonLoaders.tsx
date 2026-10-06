import React from 'react';

export const SkeletonBlock: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}> = ({ width = '100%', height = '16px', borderRadius = '6px', style, className = '' }) => (
  <div
    className={`skeleton-shimmer ${className}`}
    style={{
      width,
      height,
      borderRadius,
      ...style,
    }}
  />
);

export const SkeletonCard: React.FC = () => (
  <div className="skeleton-card-container">
    <div style={{ height: '140px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SkeletonBlock width="54px" height="54px" borderRadius="50%" />
    </div>
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <SkeletonBlock width="70%" height="18px" />
      <SkeletonBlock width="90%" height="13px" />
      <SkeletonBlock width="50%" height="13px" />
      <div style={{ paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBlock width="35%" height="14px" />
        <SkeletonBlock width="30%" height="14px" />
      </div>
    </div>
  </div>
);

export const SkeletonTicket: React.FC = () => (
  <div className="ticket-card" style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: '#ffffff' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
      <div style={{ width: '60%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SkeletonBlock width="80%" height="18px" />
        <SkeletonBlock width="50%" height="13px" />
      </div>
      <SkeletonBlock width="80px" height="24px" borderRadius="16px" />
    </div>
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
      <SkeletonBlock width="45%" height="14px" />
      <SkeletonBlock width="35%" height="14px" />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
      <SkeletonBlock width="30%" height="14px" />
      <SkeletonBlock width="70px" height="28px" borderRadius="6px" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 4 }) => (
  <div className="skeleton-table-wrapper">
    <div className="skeleton-table-row" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} style={{ flex: 1 }}>
          <SkeletonBlock width="60%" height="14px" />
        </div>
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="skeleton-table-row">
        {Array.from({ length: columns }).map((_, c) => (
          <div key={c} style={{ flex: 1 }}>
            <SkeletonBlock width={c === 0 ? '75%' : '55%'} height="14px" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonDetail: React.FC = () => (
  <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    {/* Header */}
    <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      <SkeletonBlock width="80px" height="80px" borderRadius="16px" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <SkeletonBlock width="45%" height="26px" />
        <SkeletonBlock width="70%" height="15px" />
        <SkeletonBlock width="30%" height="15px" />
      </div>
    </div>

    {/* Content */}
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
      <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <SkeletonBlock width="35%" height="20px" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ padding: '1rem', border: '1px solid #f1f5f9', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '60%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SkeletonBlock width="50%" height="16px" />
              <SkeletonBlock width="80%" height="13px" />
            </div>
            <SkeletonBlock width="80px" height="34px" borderRadius="8px" />
          </div>
        ))}
      </div>
      <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <SkeletonBlock width="50%" height="20px" />
        <SkeletonBlock width="100%" height="100px" borderRadius="10px" />
      </div>
    </div>
  </div>
);
