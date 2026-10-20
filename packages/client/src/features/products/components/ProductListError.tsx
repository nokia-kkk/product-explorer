import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ProductListErrorProps = {
  onRetry: () => void;
  /** Omitted where the banner should stay until the query succeeds. */
  onDismiss?: () => void;
};

/** The shared failed-to-load banner: moss-tinted card, alert icon, retry first. */
function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  testId,
  retryTestId,
}: {
  message: string;
  onRetry: () => void;
  onDismiss?: () => void;
  testId?: string;
  retryTestId?: string;
}) {
  return (
    <div
      role="alert"
      data-testid={testId}
      className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/25 border-l-2 border-l-destructive bg-destructive/[0.04] px-4 py-3 text-sm text-foreground"
    >
      <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0 text-destructive" />
      <span className="mr-auto">{message}</span>
      <Button type="button" variant="outline" size="sm" data-testid={retryTestId} onClick={onRetry}>
        Retry
      </Button>
      {onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          <X />
        </Button>
      )}
    </div>
  );
}

export function ProductListError({ onRetry, onDismiss }: ProductListErrorProps) {
  return (
    <ErrorBanner
      message="Failed to load products. Please try again."
      testId="products-error-banner"
      retryTestId="products-retry"
      onRetry={onRetry}
      onDismiss={onDismiss}
    />
  );
}

type CategoryListErrorProps = {
  onRetry: () => void;
};

/** The failed-to-load banner for the category list. */
export function CategoryListError({ onRetry }: CategoryListErrorProps) {
  return <ErrorBanner message="Failed to load categories. Please try again." onRetry={onRetry} />;
}
