import { Button } from '@/components/ui/button';

type ProductListErrorProps = {
  onRetry: () => void;
  /** Omitted where the banner should stay until the query succeeds. */
  onDismiss?: () => void;
};

/** The failed-to-load banner for the product list, with optional dismiss. */
export function ProductListError({ onRetry, onDismiss }: ProductListErrorProps) {
  return (
    <div
      role="alert"
      data-testid="products-error-banner"
      className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <span>Failed to load products. Please try again.</span>
      <span className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="products-retry"
          className="border-destructive/40 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onRetry}
        >
          Retry
        </Button>
        {onDismiss && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        )}
      </span>
    </div>
  );
}

type CategoryListErrorProps = {
  onRetry: () => void;
};

/** The failed-to-load banner for the category list. */
export function CategoryListError({ onRetry }: CategoryListErrorProps) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <span>Failed to load categories. Please try again.</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-destructive/40 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  );
}
