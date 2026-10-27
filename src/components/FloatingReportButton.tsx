import React from 'react';
import { Bug } from 'lucide-react';
import { openBugReportModal } from '../services/bugReportService';

export const FloatingReportButton: React.FC = () => {
  return (
    <button
      type="button"
      className="floating-report-btn"
      onClick={openBugReportModal}
      title="Reportar un error técnico o sugerencia"
      aria-label="Reportar un error a soporte técnico"
    >
      <Bug size={17} />
      <span className="floating-report-text">Reportar error</span>
    </button>
  );
};
