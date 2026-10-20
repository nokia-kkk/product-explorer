import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

/** The page numbers to show, with '…' gaps once there are more than seven pages. */
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

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  // Clamped rather than range-checked: `page` can be beyond the last page (an
  // out-of-range URL), where Previous must still take you somewhere. Each button
  // carries the state that disables the cases that would otherwise fall out.
  const goTo = useCallback(
    (target: number) => {
      onPageChange(Math.min(Math.max(target, 1), pageCount));
    },
    [pageCount, onPageChange]
  );

  return (
    <nav
      aria-label="Product list pagination"
      className="flex flex-col items-center gap-3 border-t border-border pt-6 sm:flex-row sm:justify-center"
    >
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-0.5 px-2"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeft />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {computePageNumbers(page, pageCount).map((entry, index) =>
          entry === '…' ? (
            <span
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="px-1 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={`page-${entry}`}
              type="button"
              variant={entry === page ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'min-w-9 px-2 tabular-nums',
                entry === page
                  ? 'pointer-events-none font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={`Page ${entry}`}
              aria-current={entry === page ? 'page' : undefined}
              onClick={() => goTo(entry)}
            >
              {entry}
            </Button>
          )
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-0.5 px-2"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => goTo(page + 1)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight />
        </Button>
      </div>

      <span
        aria-live="polite"
        className="text-xs text-muted-foreground sm:ml-4 sm:border-l sm:border-border sm:pl-4"
      >
        Page {page} of {pageCount}
      </span>
    </nav>
  );
}
