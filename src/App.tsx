import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { queryClient } from "@/lib/react-query";
import ScrollToTop from "@/components/ScrollToTop";
import ProfileSelection from "./pages/ProfileSelection";
import AppLayout from "@/components/AppLayout";
import { DeviceProvider } from "@/context/DeviceContext";
import { SEO_CATEGORY_PAGES } from "@/lib/seo";

// Lazy load heavy routes; profile gate stays eager so "/" does not show a full-route spinner
const Index = lazy(() => import("./pages/Index"));
const Movies = lazy(() => import("./pages/Movies"));
const TVShows = lazy(() => import("./pages/TVShows"));
const NewAndPopular = lazy(() => import("./pages/NewAndPopular"));
const MyList = lazy(() => import("./pages/MyList"));
const Search = lazy(() => import("./pages/Search"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const WhatIsMoonflix = lazy(() => import("./pages/WhatIsMoonflix"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MediaDetailPage = lazy(() => import("./pages/MediaDetailPage"));
const FranchiseCollectionPage = lazy(() => import("./pages/FranchiseCollectionPage"));
const CategoryBrowsePage = lazy(() => import("./pages/CategoryBrowsePage"));
const AiSearchMobilePage = lazy(() => import("./pages/AiSearchMobilePage"));
const MoonflixWrapped = lazy(() => import("./pages/MoonflixWrapped"));

// Loading component for route transitions
const RouteLoader = () => (
  <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DeviceProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route
                path="/"
                element={
                  import.meta.env.VITE_PROFILE === "true"
                    ? <Navigate to="/browse" replace />
                    : <ProfileSelection />
                }
              />
              <Route path="/profiles" element={<ProfileSelection />} />
              <Route element={<AppLayout />}>
                <Route path="/browse" element={<Index />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/tv-shows" element={<TVShows />} />
                <Route path="/new-popular" element={<NewAndPopular />} />
                <Route path="/my-list" element={<MyList />} />
                <Route path="/search" element={<Search />} />
                <Route path="/ai-search" element={<AiSearchMobilePage />} />
                <Route path="/wrapped" element={<MoonflixWrapped />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                <Route path="/what-is-moonflix" element={<WhatIsMoonflix />} />
                <Route path="/franchise/:slug" element={<FranchiseCollectionPage />} />
                <Route path="/movie/:slug" element={<MediaDetailPage />} />
                <Route path="/tv/:slug" element={<MediaDetailPage />} />
                <Route path="/anime/:slug" element={<MediaDetailPage />} />
                {SEO_CATEGORY_PAGES.map((cat) => (
                  <Route key={cat.path} path={cat.path} element={<CategoryBrowsePage />} />
                ))}
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </DeviceProvider>
  </QueryClientProvider>
);

export default App;
