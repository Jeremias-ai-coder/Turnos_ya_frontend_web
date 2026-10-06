import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
  itemLabel = 'elementos',
}) => {
  if (totalPages <= 1) return null;

  // Generador de páginas con elipsis
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  // Cálculo de texto informativo
  const getInfoText = () => {
    if (totalItems !== undefined && itemsPerPage !== undefined) {
      const start = (currentPage - 1) * itemsPerPage + 1;
      const end = Math.min(currentPage * itemsPerPage, totalItems);
      return `Mostrando ${start} - ${end} de ${totalItems} ${itemLabel}`;
    }
    return `Página ${currentPage} de ${totalPages}`;
  };

  return (
    <div className={`pagination-wrapper ${className}`}>
      <span className="pagination-info">{getInfoText()}</span>

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Página anterior"
          title="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, index) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                …
              </span>
            );
          }

          const pageNum = p as number;
          return (
            <button
              key={pageNum}
              className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          className="pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Página siguiente"
          title="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
