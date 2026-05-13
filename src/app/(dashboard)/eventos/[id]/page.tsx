"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs } from "@/lib/firebase";
import { Evento, formatTimestamp } from "@/types";
import { Header } from "@/components/layout/Header";
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

export default function EventoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ inscripciones: 0, gastos: 0 });

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const docSnap = await getDoc(doc("eventos/" + id));
        if (docSnap.exists) {
          setEvento({ id: docSnap.id, ...docSnap.data() } as Evento);
        }

        const [inscSnap, gastosSnap] = await Promise.all([
          getDocs(collection("inscripciones")),
          getDocs(collection("gastos")),
        ]);
        const inscCount = inscSnap.docs.filter((d) => d.data().eventoId === id).length;
        const gastosCount = gastosSnap.docs.filter((d) => d.data().eventoId === id).length;
        setStats({ inscripciones: inscCount, gastos: gastosCount });
      } catch (error) {
        console.error("Error fetching evento:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvento();
  }, [id]);

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
        <Button onClick={() => router.push("/eventos")} className="mt-4">
          Volver a eventos
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={evento.nombre}
        subtitle={`ID: ${evento.id}`}
        action={{
          label: "Ver Dashboard",
          onClick: () => router.push(`/eventos/${id}/dashboard`),
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Información del Evento</h2>
              <Badge variant={statusColors[evento.estatus] || "default"}>
                {statusLabels[evento.estatus] || evento.estatus}
              </Badge>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Descripción</p>
                <p className="text-slate-200">{evento.descripcion || "Sin descripción"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Fecha de inicio</p>
                  <p className="text-slate-200">{formatTimestamp(evento.fechaInicio)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Fecha de fin</p>
                  <p className="text-slate-200">{formatTimestamp(evento.fechaFin)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Lugar</p>
                <p className="text-slate-200">{evento.lugar || "No especificado"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button variant="secondary" onClick={() => router.push(`/eventos/${id}/inscripciones/nueva`)}>
                Nueva Inscripción
              </Button>
              <Button variant="secondary" onClick={() => router.push(`/eventos/${id}/inscripciones`)}>
                Ver Inscripciones
              </Button>
              <Button variant="secondary" onClick={() => router.push(`/eventos/${id}/gastos/nuevo`)}>
                Registrar Gasto
              </Button>
              <Button variant="secondary" onClick={() => router.push(`/eventos/${id}/gastos`)}>
                Ver Gastos
              </Button>
              <Button variant="secondary" onClick={() => router.push(`/eventos/${id}/reportes`)}>
                Ver Reportes
              </Button>
              <Button variant="secondary" onClick={() => router.push(`/eventos/${id}/configuracion`)}>
                Configuración
              </Button>
              <Button variant="secondary" onClick={() => router.push(`/eventos/${id}/tareas`)}>
                Tareas
              </Button>
              <Button variant="secondary" onClick={() => router.push(`/eventos/${id}/espacios`)}>
                Espacios
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Resumen</h2>
            <div className="space-y-4">
              <button
                onClick={() => router.push(`/eventos/${id}/inscripciones`)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <span className="text-slate-400">Inscripciones</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-100">{stats.inscripciones}</span>
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              <button
                onClick={() => router.push(`/eventos/${id}/gastos`)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <span className="text-slate-400">Gastos</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-100">{stats.gastos}</span>
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}