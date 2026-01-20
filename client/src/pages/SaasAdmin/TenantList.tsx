import { useEffect, useMemo, useState } from "react";
import PlatformLayout from "@/components/PlatformLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { fetchWithRefresh } from "@/lib/refresh-interceptor";

type TenantSummary = {
  id: string;
  name: string;
  subdomain: string;
  status: "trial" | "active" | "suspended" | "canceled";
  createdAt: string;
};

const statusLabels: Record<TenantSummary["status"], string> = {
  trial: "Prøve",
  active: "Aktiv",
  suspended: "Suspendert",
  canceled: "Kansellert",
};

const statusOptions: Array<{ value: TenantSummary["status"]; label: string }> = [
  { value: "trial", label: "Prøve" },
  { value: "active", label: "Aktiv" },
  { value: "suspended", label: "Suspendert" },
  { value: "canceled", label: "Kansellert" },
];

export default function TenantList() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [updatingTenantId, setUpdatingTenantId] = useState<string | null>(null);

  const loadTenants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchWithRefresh("/api/platform/tenants");
      if (!response.ok) {
        throw new Error("Kunne ikke hente salonger");
      }
      const data = await response.json();
      setTenants(data.tenants ?? []);
    } catch (err) {
      console.error("Failed to load tenants", err);
      setError("Kunne ikke hente salonger akkurat nå.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTenants();
  }, []);

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tenants;
    return tenants.filter(
      tenant =>
        tenant.name.toLowerCase().includes(query) ||
        tenant.subdomain.toLowerCase().includes(query)
    );
  }, [search, tenants]);

  const handleStatusChange = async (
    tenantId: string,
    status: TenantSummary["status"]
  ) => {
    setUpdatingTenantId(tenantId);
    try {
      const response = await fetchWithRefresh(
        `/api/platform/tenants/${tenantId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Kunne ikke oppdatere status");
      }

      setTenants(prev =>
        prev.map(tenant =>
          tenant.id === tenantId ? { ...tenant, status } : tenant
        )
      );
      toast.success("Status oppdatert");
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Kunne ikke oppdatere status");
    } finally {
      setUpdatingTenantId(null);
    }
  };

  return (
    <PlatformLayout title="Salonger">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Alle salonger</h2>
            <p className="text-sm text-muted-foreground">
              Oversikt over alle registrerte salonger i plattformen.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadTenants}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Oppdater
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Input
              placeholder="Søk etter navn eller subdomene..."
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="md:max-w-sm"
            />
            <div className="text-sm text-muted-foreground">
              {filteredTenants.length} salonger
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salong</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opprettet</TableHead>
                <TableHead className="text-right">Handling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Laster salonger...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-red-600">
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Ingen salonger funnet.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map(tenant => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {tenant.subdomain}.stylora.no
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tenant.status === "active"
                            ? "default"
                            : tenant.status === "trial"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {statusLabels[tenant.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(tenant.createdAt).toLocaleDateString("no-NO")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={tenant.status}
                        onValueChange={value =>
                          handleStatusChange(
                            tenant.id,
                            value as TenantSummary["status"]
                          )
                        }
                        disabled={updatingTenantId === tenant.id}
                      >
                        <SelectTrigger className="w-40 ml-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </PlatformLayout>
  );
}
