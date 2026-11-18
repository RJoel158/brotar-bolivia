import type { FC } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface DynamicPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const DynamicPagination: FC<DynamicPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const getPageNumbers = (): (number | string)[] => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', safeTotalPages];
    }

    if (safeCurrentPage >= safeTotalPages - 3) {
      return [
        1,
        '...',
        safeTotalPages - 4,
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages,
      ];
    }

    return [
      1,
      '...',
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      '...',
      safeTotalPages,
    ];
  };

  const pages = getPageNumbers();

  return (
    <div className="pagination-bottom-container">
      <div className="pagination-wrapper">
        <button
          type="button"
          className="page-btn nav-arrow"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          title="Página anterior"
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((item, index) => {
          if (item === '...') {
            return (
              <span key={`dots-${index}`} className="page-dots">
                ...
              </span>
            );
          }

          const pageNum = Number(item);
          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              className={`page-btn ${safeCurrentPage === pageNum ? 'active' : ''}`}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          className="page-btn nav-arrow"
          disabled={safeCurrentPage >= safeTotalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          title="Página siguiente"
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
