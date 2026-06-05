import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.warn(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      "- Redirecting to browse page"
    );
    
    // Automatically redirect to browse page
    navigate("/browse", { replace: true });
  }, [location.pathname, navigate]);

  // Show a brief loading message while redirecting
  return (
    <div className="min-h-dvh min-h-dvh-fallback flex items-center justify-center bg-background pt-safe pb-safe">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to home page...</p>
      </div>
    </div>
  );
};

export default NotFound;
