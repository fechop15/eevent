"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "@/lib/firebase";
import { Gasto, formatTimestamp } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function GastoDetallePage({ params }: { params: Promise<{ id: string; gastoId: string }> }) {
  const { gastoId } = use(params);
  const router = useRouter();
  const [gasto, setGasto] = useState<Gasto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGasto = async () => {
      try {
        const snap = await getDoc(doc(`gastos/${gastoId}`));
        if (snap.exists) {
          setGasto({ id: snap.id, ...snap.data() } as Gasto);
        }
      } catch (err) {
        console.error("Error fetching gasto:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGasto();
  }, [gastoId]);

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

  if (!gasto) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Gasto no encontrado</p>
        <Button onClick={() => router.back()} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Header title="Detalle del Gasto" subtitle={gasto.descripcion} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Información</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Monto</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(gasto.monto)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Forma de pago</p>
                <Badge variant={gasto.tipoPago === "efectivo" ? "info" : "purple"}>
                  {gasto.tipoPago}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Categoría</p>
                <p className="text-slate-200 capitalize">{gasto.categoria}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Fecha</p>
                <p className="text-slate-200">{formatTimestamp(gasto.fechaGasto)}</p>
              </div>
              {gasto.referencia && (
                <div className="col-span-2">
                  <p className="text-sm text-slate-400 mb-1">Referencia</p>
                  <p className="text-slate-200">{gasto.referencia}</p>
                </div>
              )}
              {gasto.observaciones && (
                <div className="col-span-2">
                  <p className="text-sm text-slate-400 mb-1">Observaciones</p>
                  <p className="text-slate-200">{gasto.observaciones}</p>
                </div>
              )}
            </div>
          </Card>

          {gasto.soporteData && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Soporte</h2>
              <div className="p-4 border border-white/10 rounded-lg bg-slate-800/50">
                {gasto.soporteMimeType.startsWith("image/") ? (
                  <img
                    src={`data:${gasto.soporteMimeType};base64,${gasto.soporteData}`}
                    alt="Soporte"
                    className="max-w-full rounded object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-slate-200">{gasto.soporteNombre}</p>
                      <a
                        href={`data:${gasto.soporteMimeType};base64,${gasto.soporteData}`}
                        download={gasto.soporteNombre}
                        className="text-sm text-primary hover:text-primary-hover cursor-pointer"
                      >
                        Descargar
                      </a>
                    </div>
                  </div>
                )}
                {gasto.soporteMimeType.startsWith("image/") && (
                  <a
                    href={`data:${gasto.soporteMimeType};base64,${gasto.soporteData}`}
                    download={gasto.soporteNombre}
                    className="mt-3 flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar imagen
                  </a>
                )}
              </div>
            </Card>
          )}
        </div>

        <div>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Acciones</h2>
            <div className="space-y-3">
              <Button variant="secondary" className="w-full" onClick={() => router.back()}>
                Volver a gastos
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
