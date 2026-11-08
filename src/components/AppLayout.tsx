import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { NavbarSearchProvider } from '@/context/NavbarSearchContext';
import { RouteSeo } from '@/components/RouteSeo';
import { syncHeapIdentity } from '@/lib/heap';

export default function AppLayout() {
  useEffect(() => {
    syncHeapIdentity();
  }, []);

  return (
    <NavbarSearchProvider>
      <RouteSeo />
      <div className="min-h-dvh min-h-dvh-fallback bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md pt-safe"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="pt-nav-offset" tabIndex={-1}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </NavbarSearchProvider>
  );
}
