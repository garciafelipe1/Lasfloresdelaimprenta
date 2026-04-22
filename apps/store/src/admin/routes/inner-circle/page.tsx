"use client";

import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Sparkles } from "@medusajs/icons";
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  Toaster,
  toast,
} from "@medusajs/ui";
import { medusaSdk } from "@/admin/lib/config";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

type InnerCircleGetResponse = {
  customerId: string;
  email: string | null;
  name: string | null;
  hasActiveSubscription: boolean;
  benefitsActive: boolean;
  historicLoyaltySince: string | null;
  manualOverride: boolean;
  notes: string | null;
  innerCircle: {
    tier: string;
    labelEs: string;
    catalogDiscountPercent: number;
    memberSince: string;
    source: string;
  } | null;
  promoCode: string | null;
  audit: { at: string; actorId?: string; action: string; detail?: string }[];
};

const TIER_OPTIONS = [
  { value: "solido", label: "Lead Sólido (5% catálogo)" },
  { value: "senior", label: "Lead Senior (7% catálogo)" },
  { value: "vip", label: "Lead VIP (10% catálogo)" },
];

function InnerCirclePageInner() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState("");
  const [appliedId, setAppliedId] = useState("");
  const [manualTier, setManualTier] = useState("solido");
  const [manualNotes, setManualNotes] = useState("");

  useEffect(() => {
    const q = searchParams.get("customer_id");
    if (q) {
      setCustomerId(q);
      setAppliedId(q);
    }
  }, [searchParams]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["inner-circle-admin", appliedId],
    queryFn: () =>
      medusaSdk.client.fetch<InnerCircleGetResponse>(
        `/membership/inner-circle/${encodeURIComponent(appliedId)}`,
      ),
    enabled: appliedId.length > 8,
  });

  const putMutation = useMutation({
    mutationFn: async (body: { mode: "auto" } | { mode: "manual"; tier: string; notes?: string }) => {
      await medusaSdk.client.fetch(`/membership/inner-circle/${encodeURIComponent(appliedId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      toast.success("Cambios guardados");
      await queryClient.invalidateQueries({ queryKey: ["inner-circle-admin", appliedId] });
    },
  });

  const handleLoad = () => {
    setAppliedId(customerId.trim());
  };

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex flex-col gap-2 px-6 py-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Heading level="h2">Inner Circle</Heading>
            <Text size="small" className="text-ui-fg-muted mt-1">
              Niveles Lead Sólido / Senior / VIP: antigüedad histórica desde la primera suscripción; override
              manual con auditoría. Los cupones de catálogo se sincronizan al guardar.
            </Text>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4">
          <div className="flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="ic-customer-id">Customer ID</Label>
              <Input
                id="ic-customer-id"
                placeholder="cus_..."
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              />
            </div>
            <Button type="button" variant="secondary" onClick={handleLoad}>
              Cargar
            </Button>
          </div>
        </div>

        {!appliedId ? (
          <div className="px-6 py-6">
            <Text>Ingresá un customer id (desde la tabla de miembros).</Text>
          </div>
        ) : isLoading ? (
          <div className="px-6 py-6">
            <Text>Cargando…</Text>
          </div>
        ) : isError ? (
          <div className="flex flex-col gap-2 px-6 py-6">
            <Text className="text-ui-fg-error">No se pudo cargar. Revisá el id o la sesión de admin.</Text>
            <Button variant="secondary" size="small" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : data ? (
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-lg border border-ui-border-base p-4">
              <Text size="small" className="font-semibold">
                Estado
              </Text>
              <div className="flex flex-wrap gap-2">
                <Badge color={data.hasActiveSubscription ? "green" : "grey"}>
                  {data.hasActiveSubscription ? "Suscripción activa" : "Sin suscripción activa"}
                </Badge>
                <Badge color={data.benefitsActive ? "green" : "grey"}>
                  {data.benefitsActive ? "Beneficios aplicables" : "Beneficios no activos"}
                </Badge>
                {data.manualOverride ? (
                  <Badge color="orange">Override manual</Badge>
                ) : (
                  <Badge color="blue">Automático por antigüedad</Badge>
                )}
              </div>
              <Text size="small" className="text-ui-fg-muted">
                Email: {data.email ?? "—"} · {data.name ?? "—"}
              </Text>
              <Text size="small">
                Antigüedad histórica (primera <code className="text-xs">started_at</code>):{" "}
                {data.historicLoyaltySince
                  ? new Date(data.historicLoyaltySince).toLocaleString("es-AR")
                  : "—"}
              </Text>
              {data.innerCircle ? (
                <div className="mt-2 rounded-md bg-ui-bg-subtle p-3">
                  <Text className="font-semibold">{data.innerCircle.labelEs}</Text>
                  <Text size="small" className="text-ui-fg-muted">
                    Fuente: {data.innerCircle.source === "manual" ? "Manual" : "Automática"} ·{" "}
                    {data.innerCircle.catalogDiscountPercent}% catálogo · memberSince en payload:{" "}
                    {new Date(data.innerCircle.memberSince).toLocaleDateString("es-AR")}
                  </Text>
                </div>
              ) : (
                <Text size="small" className="text-ui-fg-muted">
                  Sin datos de Inner Circle (sin suscripciones con fecha de inicio).
                </Text>
              )}
              <Text size="small" className="text-ui-fg-muted">
                Cupón vigente en metadata: {data.promoCode ?? "—"}
              </Text>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-ui-border-base p-4">
              <Text size="small" className="font-semibold">
                Acciones (solo admin)
              </Text>
              <Button
                type="button"
                variant="secondary"
                disabled={putMutation.isPending}
                onClick={() => putMutation.mutate({ mode: "auto" })}
              >
                Volver a nivel automático
              </Button>
              <div className="border-t border-ui-border-base pt-4">
                <Text size="small" className="mb-2 text-ui-fg-muted">
                  Forzar nivel manual (auditoría en metadata)
                </Text>
                <div className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor="ic-tier">Nivel</Label>
                    <select
                      id="ic-tier"
                      className="mt-1 w-full rounded-md border border-ui-border-base bg-ui-bg-field-component px-3 py-2 text-sm"
                      value={manualTier}
                      onChange={(e) => setManualTier(e.target.value)}
                    >
                      {TIER_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="ic-notes">Notas (opcional)</Label>
                    <Textarea
                      id="ic-notes"
                      rows={3}
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      placeholder="Motivo del cambio, ticket interno, etc."
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={putMutation.isPending}
                    onClick={() =>
                      putMutation.mutate({
                        mode: "manual",
                        tier: manualTier as "solido" | "senior" | "vip",
                        notes: manualNotes.trim() || undefined,
                      })
                    }
                  >
                    Guardar override manual
                  </Button>
                </div>
              </div>
              {putMutation.isError ? (
                <Text size="small" className="text-ui-fg-error">
                  Error al guardar.
                </Text>
              ) : null}
            </div>

            {data.audit?.length ? (
              <div className="lg:col-span-2">
                <Text size="small" className="mb-2 font-semibold">
                  Auditoría reciente
                </Text>
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-ui-border-base p-3 text-sm">
                  {[...data.audit].reverse().map((a, i) => (
                    <li key={`${a.at}-${i}`} className="text-ui-fg-muted">
                      <span className="font-mono text-xs">{a.at}</span> · {a.action}
                      {a.detail ? ` · ${a.detail}` : ""}
                      {a.actorId ? ` · actor ${a.actorId}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Container>
      <Toaster />
    </>
  );
}

const Page = () => <InnerCirclePageInner />;

export const config = defineRouteConfig({
  label: "Inner Circle",
  icon: Sparkles,
});

export default Page;
