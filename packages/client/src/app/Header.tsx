import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { useSearchField } from '@/shared/hooks/useSearchField';
import { cn } from '@/lib/utils';

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'w-fit border-b-2 pb-0.5 text-sm transition-colors',
    isActive
      ? 'border-primary font-medium text-foreground'
      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
  );

/** Routes that show product listings (and therefore the header search input). */
function isListingRoute(pathname: string): boolean {
  return pathname === '/' || /^\/categories\/[^/]+$/.test(pathname);
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const showSearch = isListingRoute(pathname);

  // Unlike the toolbar's input, this one always lands on the full product list,
  // so it commits by navigating rather than editing the current listing.
  const commit = useCallback(
    (q: string) => {
      navigate({ pathname: '/', search: q ? `?q=${encodeURIComponent(q)}` : '' });
    },
    [navigate]
  );
  const [term, setTerm] = useSearchField(searchParams.get('q') ?? '', commit);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commit(term.trim());
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 md:gap-6 md:px-6">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>

        <Link
          to="/"
          className="whitespace-nowrap font-display text-xl leading-none text-foreground transition-colors hover:text-primary md:text-2xl"
        >
          Nokia app
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          <NavLink to="/" end className={navLinkClassName}>
            Products
          </NavLink>
          <NavLink to="/categories" className={navLinkClassName}>
            Categories
          </NavLink>
        </nav>

        {showSearch && (
          <form
            role="search"
            onSubmit={handleSubmit}
            className="ml-auto min-w-0 flex-1 md:ml-0 md:flex-none"
          >
            {/* Distinct from the toolbar's input, which filters the listing in place;
                this one always navigates to the full product list. */}
            <SearchInput
              name="q"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              aria-label="Search all products"
              placeholder="Search products…"
              className="w-full md:w-64"
            />
          </form>
        )}
      </div>

      {menuOpen && (
        <div id="mobile-nav" className="border-t border-border md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-2 px-4 py-4">
            <NavLink to="/" end className={navLinkClassName} onClick={() => setMenuOpen(false)}>
              Products
            </NavLink>
            <NavLink
              to="/categories"
              className={navLinkClassName}
              onClick={() => setMenuOpen(false)}
            >
              Categories
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}
