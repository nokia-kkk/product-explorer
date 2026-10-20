import * as React from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from './input';

/** The shadcn input with an inset search glyph; caller classes must not reset `pl-9`. */
const SearchInput = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input ref={ref} type="search" className={cn('pl-9', className)} {...props} />
    </div>
  )
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
