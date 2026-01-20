import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { LogOut, Users } from "lucide-react";

type PlatformLayoutProps = {
  children: ReactNode;
  title?: string;
};

export default function PlatformLayout({
  children,
  title = "Plattformadministrasjon",
}: PlatformLayoutProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Laster...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container flex flex-col gap-4 py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Platform Admin
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              {user?.email && (
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
              )}
              <Button
                variant="outline"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  setLocation("/saas-admin/login");
                }}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logg ut
              </Button>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/saas-admin/dashboard">
              <Button variant="secondary" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Salonger
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
