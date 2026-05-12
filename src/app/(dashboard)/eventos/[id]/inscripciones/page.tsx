"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Inscripcion } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

const estadoPagoColors: Record<string, "default" | "success" | "warning" | "danger"> = {
  pendiente: "danger",
  abono: "warning",
  pagado: "success",
  cancelado: "default",
};

export default function InscripcionesEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventoId } = use(params);
  const router = useRouter();
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInscripciones = async () => {
      try {
        const q = query(
          collection(db, "inscripciones"),
          where("eventoId", "==", eventoId),
          orderBy("fechaCreacion", "desc")
        );
        const snapshot = await getDocs(q);
        setInscripciones(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Inscripcion[]);
      } catch (error) {
        console.error("Error fetching inscripciones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInscripciones();
  }, [eventoId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Inscripciones"
        subtitle={`Total: ${inscripciones.length}`}
        action={{
          label: "+ Nueva Inscripción",
          onClick: () => router.push(`/eventos/${eventoId}/inscripciones/nueva`),
        }}
      />

      {inscripciones.length === 0 ? (
        <EmptyState
          title="No hay inscripciones"
          description="Registra la primera inscripción."
          action={
            <Button onClick={() => router.push(`/eventos/${eventoId}/inscripciones/nueva`)}>
              Nueva Inscripción
            </Button>
          }
        />
      ) : (
        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Abono</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Restante</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inscripciones.map((insc) => (
                <tr
                  key={insc.id}
                  className="border-b border-white/5 hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/eventos/${eventoId}/inscripciones/${insc.id}/pagos`)}
                >
                  <td className="px-4 py-3 text-sm text-slate-400">{insc.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3">
                    <Badge variant={estadoPagoColors[insc.estadoPago] || "default"}>
                      {insc.estadoPago}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-slate-100">
                    {formatCurrency(insc.valorTotal)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-emerald-400">
                    {formatCurrency(insc.valorAbono)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-amber-400">
                    {formatCurrency(insc.valorRestante)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm">
                      Ver
                    </Button>
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
