"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Evento } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const statusColors: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  borrador: "default",
  activo: "success",
  finalizado: "info",
  cancelado: "danger",
};

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  activo: "Activo",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export default function DashboardEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInscripciones: 0,
    ingresosTotales: 0,
    abonos: 0,
    pendiente: 0,
    totalGastos: 0,
    balance: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventoDoc = await getDoc(doc(db, "eventos", id));
        if (eventoDoc.exists()) {
          setEvento({ id: eventoDoc.id, ...eventoDoc.data() } as Evento);
        }

        const inscSnap = await getDocs(
          query(collection(db, "inscripciones"), where("eventoId", "==", id))
        );
        const gastosSnap = await getDocs(
          query(collection(db, "gastos"), where("eventoId", "==", id))
        );

        let ingresosTotales = 0;

        inscSnap.docs.forEach((doc) => {
          const data = doc.data();
          ingresosTotales += data.valorAbono || 0;
        });

        let totalGastos = 0;
        gastosSnap.docs.forEach((doc) => {
          totalGastos += doc.data().monto || 0;
        });

        setStats({
          totalInscripciones: inscSnap.size,
          ingresosTotales,
          abonos: 0,
          pendiente: 0,
          totalGastos,
          balance: ingresosTotales - totalGastos,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: { toDate: () => Date } | null | undefined) => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Evento no encontrado</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-100">{evento.nombre}</h1>
            <Badge variant={statusColors[evento.estatus] || "default"}>
              {statusLabels[evento.estatus] || evento.estatus}
            </Badge>
          </div>
          <p className="text-sm text-slate-400">
            {formatDate(evento.fechaInicio)} - {formatDate(evento.fechaFin)}
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push(`/eventos/${id}`)}>
          Volver al evento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-2">Total Inscripciones</p>
          <p className="text-3xl font-bold text-slate-100">{stats.totalInscripciones}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-2">Ingresos (Abonos)</p>
          <p className="text-3xl font-bold text-emerald-400">{formatCurrency(stats.ingresosTotales)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-2">Total Gastos</p>
          <p className="text-3xl font-bold text-red-400">{formatCurrency(stats.totalGastos)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-2">Balance</p>
          <p className={`text-3xl font-bold ${stats.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatCurrency(stats.balance)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Inscripciones</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push(`/eventos/${id}/inscripciones/nueva`)}>
              + Nueva
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-slate-400">Pendiente</span>
              <span className="font-medium text-amber-400">{formatCurrency(stats.pendiente)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">Total Inscripciones</span>
              <span className="font-medium text-slate-100">{stats.totalInscripciones}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Gastos</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push(`/eventos/${id}/gastos/nuevo`)}>
              + Nuevo
            </Button>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-400">Total Gastos</span>
            <span className="font-medium text-slate-100">{formatCurrency(stats.totalGastos)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
