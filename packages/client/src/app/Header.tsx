import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    isActive
      ? 'font-medium text-foreground'
      : 'text-muted-foreground transition-colors hover:text-foreground'
  );

/** Routes that show product listings (and therefore the header search input). */
function isListingRoute(pathname: string): boolean {
  return pathname === '/' || /^\/categories\/[^/]+$/.test(pathname);
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [term, setTerm] = useState('');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const showSearch = isListingRoute(pathname);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = term.trim();
    navigate({ pathname: '/', search: q ? `?q=${encodeURIComponent(q)}` : '' });
  };

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>

        <Link to="/" className="text-lg font-semibold text-foreground">
          MiniApp
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
          <form role="search" onSubmit={handleSubmit} className="ml-auto md:ml-0">
            {/* Distinct from the toolbar's input, which filters the listing in place;
                this one always navigates to the full product list. */}
            <Input
              type="search"
              name="q"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              aria-label="Search all products"
              placeholder="Search products…"
              className="w-44 md:w-64"
            />
          </form>
        )}
      </div>

      {menuOpen && (
        <div id="mobile-nav" className="border-t md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1 px-4 py-3">
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
