import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  inline?: boolean;
  color?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: 16,
  md: 26,
  lg: 40,
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  inline = false,
  color,
  className = '',
}) => {
  const pixelSize = SIZE_MAP[size];

  return (
    <div
      className={`spinner-wrapper ${inline ? 'inline' : 'block'} ${className}`}
      style={{ color: color || 'var(--primary-color, #aa3bff)' }}
    >
      <Loader2 size={pixelSize} className="spinner-icon" />
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
