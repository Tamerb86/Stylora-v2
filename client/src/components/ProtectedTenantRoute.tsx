import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

interface ProtectedTenantRouteProps {
  children: ReactNode;
}

export default function ProtectedTenantRoute({
  children,
}: ProtectedTenantRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const shouldRedirect =
    Boolean(user?.isPlatformAdmin) && !user?.isImpersonating;

  useEffect(() => {
    if (!loading && shouldRedirect) {
      setLocation("/saas-admin/dashboard");
    }
  }, [loading, shouldRedirect, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Sender deg til plattformadministrasjonen...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
