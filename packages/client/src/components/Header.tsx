import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'font-medium text-gray-900' : 'text-gray-600 transition-colors hover:text-gray-900';

/** Routes that show product listings (and therefore the header search input). */
function isListingRoute(pathname: string): boolean {
  return pathname === '/' || /^\/categories\/[^/]+$/.test(pathname);
}

export default function Header() {
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
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-gray-200 p-2 text-gray-700 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            strokeLinecap="round"
          >
            {menuOpen ? <path d="M6 6 18 18 M18 6 6 18" /> : <path d="M4 6h16 M4 12h16 M4 18h16" />}
          </svg>
        </button>

        <Link to="/" className="text-lg font-semibold text-gray-900">
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
            <input
              type="search"
              name="q"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              aria-label="Search products"
              placeholder="Search products…"
              className="w-44 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 md:w-64"
            />
          </form>
        )}
      </div>

      {menuOpen && (
        <div id="mobile-nav" className="border-t border-gray-200 md:hidden">
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
