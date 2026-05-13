"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "@/lib/firebase";
import { Evento, formatTimestamp } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
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

export default function EventosPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const snapshot = await getDocs(collection("eventos"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Evento[];
        setEventos(data);
      } catch (error) {
        console.error("Error fetching eventos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  

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
        title="Eventos"
        subtitle="Gestiona todos tus eventos"
        action={{
          label: "+ Nuevo Evento",
          onClick: () => router.push("/eventos/nuevo"),
        }}
      />

      {eventos.length === 0 ? (
        <EmptyState
          title="No hay eventos"
          description="Crea tu primer evento para comenzar a gestionar inscripciones y pagos."
          action={
            <Button onClick={() => router.push("/eventos/nuevo")}>Crear Evento</Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventos.map((evento) => (
            <Card
              key={evento.id}
              className="p-5 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push(`/eventos/${evento.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-100 line-clamp-1">
                  {evento.nombre}
                </h3>
                <Badge variant={statusColors[evento.estatus] || "default"}>
                  {statusLabels[evento.estatus] || evento.estatus}
                </Badge>
              </div>

              <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                {evento.descripcion || "Sin descripción"}
              </p>

              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{evento.lugar || "Sin lugar"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {formatTimestamp(evento.fechaInicio)} - {formatTimestamp(evento.fechaFin)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}