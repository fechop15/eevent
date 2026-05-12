"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "@/lib/firebase";
import { Gasto } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function GastosEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventoId } = use(params);
  const router = useRouter();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGastos = async () => {
      try {
        const snapshot = await getDocs(collection("gastos"));
        const filtered = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((g) => g.eventoId === eventoId) as Gasto[];
        setGastos(filtered);
      } catch (error) {
        console.error("Error fetching gastos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGastos();
  }, [eventoId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: { toDate: () => Date } | null | undefined) => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleDateString("es-CO");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

  return (
    <div>
      <Header
        title="Gastos del Evento"
        subtitle={`Total: ${formatCurrency(totalGastos)}`}
        action={{
          label: "+ Nuevo Gasto",
          onClick: () => router.push(`/eventos/${eventoId}/gastos/nuevo`),
        }}
      />

      {gastos.length === 0 ? (
        <EmptyState
          title="No hay gastos"
          description="Registra los gastos del evento."
          action={
            <Button onClick={() => router.push(`/eventos/${eventoId}/gastos/nuevo`)}>
              Registrar Gasto
            </Button>
          }
        />
      ) : (
        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Soporte</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Monto</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((gasto) => (
                <tr
                  key={gasto.id}
                  className="border-b border-white/5 hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/eventos/${eventoId}/gastos/${gasto.id}`)}
                >
                  <td className="px-4 py-3 text-sm text-slate-400">{formatDate(gasto.fechaGasto)}</td>
                  <td className="px-4 py-3 text-sm text-slate-100">{gasto.descripcion}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="default">{gasto.categoria}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={gasto.tipoPago === "efectivo" ? "info" : "purple"}>
                      {gasto.tipoPago}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {gasto.soporteData ? (
                      <svg className="w-5 h-5 text-emerald-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-slate-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-slate-100 font-medium">
                    {formatCurrency(gasto.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}