"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "@/lib/firebase";
import { Tarea, Timestamp, formatTimestamp } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";

export default function TareasEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventoId } = use(params);
  const router = useRouter();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titulo: "", descripcion: "", fechaLimite: "" });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"todas" | "pendientes" | "completadas">("todas");

  useEffect(() => {
    const fetchTareas = async () => {
      try {
        const snapshot = await getDocs(collection("tareas"));
        const filtered = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Tarea))
          .filter((t) => t.eventoId === eventoId)
          .sort((a, b) => {
            if (a.completada !== b.completada) return a.completada ? 1 : -1;
            if (a.fechaLimite && b.fechaLimite) {
              return a.fechaLimite.seconds - b.fechaLimite.seconds;
            }
            return 0;
          });
        setTareas(filtered);
      } catch (error) {
        console.error("Error fetching tareas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTareas();
  }, [eventoId]);

  const handleToggle = async (tarea: Tarea) => {
    try {
      await updateDoc(doc("tareas/" + tarea.id), {
        completada: !tarea.completada,
        fechaActualizacion: Timestamp.now(),
      });
      setTareas((prev) =>
        prev.map((t) =>
          t.id === tarea.id ? { ...t, completada: !t.completada } : t
        )
      );
    } catch (error) {
      console.error("Error toggling tarea:", error);
    }
  };

  const handleDelete = async (tareaId: string) => {
    try {
      await deleteDoc(doc("tareas/" + tareaId));
      setTareas((prev) => prev.filter((t) => t.id !== tareaId));
    } catch (error) {
      console.error("Error deleting tarea:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setSubmitting(true);
    try {
      const fechaLimite = form.fechaLimite
        ? { seconds: Math.floor(new Date(form.fechaLimite).getTime() / 1000), nanoseconds: 0 }
        : null;
      const docRef = await addDoc(collection("tareas"), {
        eventoId,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        completada: false,
        fechaLimite,
        fechaCreacion: Timestamp.now(),
        fechaActualizacion: Timestamp.now(),
      });
      setTareas((prev) => [
        ...prev,
        {
          id: docRef.id,
          eventoId,
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          completada: false,
          fechaLimite: fechaLimite as Tarea["fechaLimite"],
          fechaCreacion: Timestamp.now(),
          fechaActualizacion: Timestamp.now(),
        },
      ]);
      setShowModal(false);
      setForm({ titulo: "", descripcion: "", fechaLimite: "" });
    } catch (error) {
      console.error("Error creating tarea:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTareas = tareas.filter((t) => {
    if (filter === "pendientes") return !t.completada;
    if (filter === "completadas") return t.completada;
    return true;
  });

  const pendientes = tareas.filter((t) => !t.completada).length;
  const completadas = tareas.filter((t) => t.completada).length;

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
        title="Tareas y Actividades"
        subtitle={`${pendientes} pendientes · ${completadas} completadas`}
        back={{ label: "Volver al evento", onClick: () => router.push(`/eventos/${eventoId}`) }}
        action={{ label: "+ Nueva Tarea", onClick: () => setShowModal(true) }}
      />

      <div className="flex items-center gap-2 mb-6">
        {(["todas", "pendientes", "completadas"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-slate-800 text-slate-400 border border-white/5"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredTareas.length === 0 ? (
        <EmptyState
          title={filter === "todas" ? "No hay tareas" : filter === "pendientes" ? "Sin tareas pendientes" : "Sin tareas completadas"}
          description={filter === "todas" ? "Crea la primera tarea para este evento." : "No hay tareas en esta categoría."}
          action={
            filter === "todas" ? (
              <Button onClick={() => setShowModal(true)}>Crear Tarea</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredTareas.map((tarea) => (
            <Card key={tarea.id} className="p-4 flex items-start gap-4">
              <button
                onClick={() => handleToggle(tarea)}
                className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  tarea.completada
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-slate-500 hover:border-primary"
                }`}
              >
                {tarea.completada && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${tarea.completada ? "text-slate-500 line-through" : "text-slate-100"}`}>
                  {tarea.titulo}
                </p>
                {tarea.descripcion && (
                  <p className={`text-xs mt-1 ${tarea.completada ? "text-slate-600" : "text-slate-400"}`}>
                    {tarea.descripcion}
                  </p>
                )}
                {tarea.fechaLimite && (
                  <p className={`text-xs mt-2 ${tarea.completada ? "text-slate-600" : "text-amber-400"}`}>
                    📅 {formatTimestamp(tarea.fechaLimite)}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(tarea.id)}
                className="shrink-0 text-slate-600 hover:text-red-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Tarea">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="titulo"
            label="Título"
            value={form.titulo}
            onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
            placeholder="Ej: Confirmar proveedores"
            required
          />
          <Textarea
            id="descripcion"
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Detalles adicionales..."
            rows={2}
          />
          <Input
            id="fechaLimite"
            label="Fecha límite (opcional)"
            type="date"
            value={form.fechaLimite}
            onChange={(e) => setForm((p) => ({ ...p, fechaLimite: e.target.value }))}
          />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              Crear Tarea
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}