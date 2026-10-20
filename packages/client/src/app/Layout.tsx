import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-12">
        <Outlet />
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-baseline justify-between gap-2 px-4 py-6 text-xs text-muted-foreground md:px-6">
          <span className="font-display text-sm text-foreground">Nokia app</span>
          <span>Demo catalogue from DummyJSON</span>
        </div>
      </footer>
    </div>
  );
}
