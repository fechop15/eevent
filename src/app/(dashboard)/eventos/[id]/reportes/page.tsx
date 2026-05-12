"use client";

import { useState, useEffect, use } from "react";
import { doc, getDoc, collection, getDocs } from "@/lib/firebase";
import { Evento } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";

export default function ReportesEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventoId } = use(params);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInscripciones: 0,
    ingresosTotales: 0,
    abonos: 0,
    pendiente: 0,
    totalGastos: 0,
    balance: 0,
    porEstado: { pendiente: 0, abono: 0, pagado: 0, cancelado: 0 },
    gastosPorCategoria: {} as Record<string, number>,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventoDoc, allInscrSnap, allGastosSnap] = await Promise.all([
          getDoc(doc("eventos/" + eventoId)),
          getDocs(collection("inscripciones")),
          getDocs(collection("gastos")),
        ]);

        if (eventoDoc.exists()) {
          setEvento({ id: eventoDoc.id, ...eventoDoc.data() } as Evento);
        }

        const filteredInscr = allInscrSnap.docs.filter((d) => d.data().eventoId === eventoId);
        let ingresosTotales = 0;
        let abonos = 0;
        let pendiente = 0;
        const porEstado = { pendiente: 0, abono: 0, pagado: 0, cancelado: 0 };

        filteredInscr.forEach((doc) => {
          const data = doc.data();
          ingresosTotales += data.valorAbono || 0;
          abonos += data.valorAbono || 0;
          pendiente += data.valorRestante || 0;
          porEstado[data.estadoPago] = (porEstado[data.estadoPago] || 0) + 1;
        });

        const filteredGastos = allGastosSnap.docs.filter((d) => d.data().eventoId === eventoId);
        let totalGastos = 0;
        const gastosPorCategoria: Record<string, number> = {};
        filteredGastos.forEach((doc) => {
          const data = doc.data();
          totalGastos += data.monto || 0;
          const cat = data.categoria || "otro";
          gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + data.monto;
        });

        setStats({
          totalInscripciones: filteredInscr.length,
          ingresosTotales,
          abonos,
          pendiente,
          totalGastos,
          balance: ingresosTotales - totalGastos,
          porEstado,
          gastosPorCategoria,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      <Header title="Reportes" subtitle={evento?.nombre} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-2">Balance</p>
          <p className={`text-3xl font-bold ${stats.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatCurrency(stats.balance)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-2">Ingresos Totales</p>
          <p className="text-3xl font-bold text-emerald-400">{formatCurrency(stats.ingresosTotales)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-2">Total Gastos</p>
          <p className="text-3xl font-bold text-red-400">{formatCurrency(stats.totalGastos)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Inscripciones por Estado</h2>
          <div className="space-y-3">
            {Object.entries(stats.porEstado).map(([estado, count]) => (
              <div key={estado} className="flex items-center justify-between">
                <span className="text-sm text-slate-400 capitalize">{estado}</span>
                <span className="font-medium text-slate-100">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Gastos por Categoría</h2>
          {Object.keys(stats.gastosPorCategoria).length === 0 ? (
            <p className="text-slate-500">Sin gastos registrados</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.gastosPorCategoria).map(([cat, monto]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 capitalize">{cat}</span>
                  <span className="font-medium text-slate-100">{formatCurrency(monto)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}