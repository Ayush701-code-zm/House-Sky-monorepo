import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  label?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  label = 'results'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  // Build visible page numbers with ellipsis
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#0B4F3C]/10">
      {/* Results info */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#171A18]/60 font-medium">
          Showing <span className="font-bold text-[#171A18]">{from}–{to}</span> of{' '}
          <span className="font-bold text-[#171A18]">{totalItems}</span> {label}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#171A18]/50 font-semibold">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="text-xs font-bold text-[#171A18] bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-lg px-2 py-1 focus:outline-none focus:border-[#0B4F3C] cursor-pointer"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#0B4F3C]/20 text-[#0B4F3C] bg-white hover:bg-[#E8F0EC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((pg, idx) =>
          pg === '...' ? (
            <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-[#171A18]/40 font-bold">
              ···
            </span>
          ) : (
            <button
              key={pg}
              onClick={() => onPageChange(pg as number)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                currentPage === pg
                  ? 'bg-[#0B4F3C] text-white border border-[#0B4F3C] shadow-sm'
                  : 'border border-[#0B4F3C]/20 text-[#171A18] bg-white hover:bg-[#E8F0EC] hover:text-[#0B4F3C]'
              }`}
            >
              {pg}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#0B4F3C]/20 text-[#0B4F3C] bg-white hover:bg-[#E8F0EC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Utility hook for pagination state management
 */
export function usePagination<T>(items: T[], defaultPageSize = 10) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);

  // Reset to page 1 whenever item list changes (e.g. after filtering)
  const itemsKey = items.length;
  React.useEffect(() => {
    setCurrentPage(1);
  }, [itemsKey]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedItems,
    setCurrentPage,
    setPageSize: (size: number) => { setPageSize(size); setCurrentPage(1); }
  };
}
