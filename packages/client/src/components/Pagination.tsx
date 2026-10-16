import { useCallback } from 'react';

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

const pageButtonClass = (active: boolean) =>
  [
    'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm',
    active
      ? 'bg-gray-900 font-semibold text-white'
      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
  ].join(' ');

function computePageNumbers(page: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);

  const result: (number | '…')[] = [];
  let previous = 0;
  for (const current of sorted) {
    if (current - previous > 1) {
      result.push('…');
    }
    result.push(current);
    previous = current;
  }
  return result;
}

export default function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  const goTo = useCallback(
    (target: number) => {
      if (target >= 1 && target <= pageCount) {
        onPageChange(target);
      }
    },
    [pageCount, onPageChange]
  );

  return (
    <nav aria-label="Product list pagination" className="flex items-center justify-center gap-1">
      <button
        type="button"
        className={pageButtonClass(false)}
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
      >
        Previous
      </button>

      {computePageNumbers(page, pageCount).map((entry, index) =>
        entry === '…' ? (
          <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-sm text-gray-500">
            …
          </span>
        ) : (
          <button
            key={`page-${entry}`}
            type="button"
            className={pageButtonClass(entry === page)}
            aria-label={`Page ${entry}`}
            aria-current={entry === page ? 'page' : undefined}
            onClick={() => goTo(entry)}
          >
            {entry}
          </button>
        )
      )}

      <button
        type="button"
        className={pageButtonClass(false)}
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => goTo(page + 1)}
      >
        Next
      </button>

      <span aria-live="polite" className="ml-2 text-sm text-gray-600">
        Page {page} of {pageCount}
      </span>
    </nav>
  );
}
