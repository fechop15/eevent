"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Textarea } from "@/components/ui/Textarea";

export default function NuevoEventoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    lugar: "",
    observaciones: "",
    fechaInicio: "",
    fechaFin: "",
    estatus: "borrador" as const,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.fechaInicio || !form.fechaFin) {
      setError("Las fechas son obligatorias");
      return;
    }

    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, "eventos"), {
        nombre: form.nombre,
        descripcion: form.descripcion,
        lugar: form.lugar,
        observaciones: form.observaciones,
        fechaInicio: Timestamp.fromDate(new Date(form.fechaInicio)),
        fechaFin: Timestamp.fromDate(new Date(form.fechaFin)),
        estatus: form.estatus,
        creadoPor: user?.uid,
        fechaCreacion: Timestamp.now(),
        fechaActualizacion: Timestamp.now(),
      });

      router.push(`/eventos/${docRef.id}`);
    } catch (err) {
      console.error("Error creando evento:", err);
      setError("Error al crear el evento. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Header title="Nuevo Evento" subtitle="Crea un nuevo evento" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          id="nombre"
          name="nombre"
          label="Nombre del evento"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Ej: Festival de Música 2026"
          required
        />

        <Textarea
          id="descripcion"
          name="descripcion"
          label="Descripción"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Describe el evento..."
          rows={4}
        />

        <Input
          id="lugar"
          name="lugar"
          label="Lugar"
          value={form.lugar}
          onChange={handleChange}
          placeholder="Ej: Centro de Convenciones, Bogotá"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            id="fechaInicio"
            name="fechaInicio"
            label="Fecha de inicio"
            value={form.fechaInicio}
            onChange={handleChange}
            required
          />
          <DatePicker
            id="fechaFin"
            name="fechaFin"
            label="Fecha de fin"
            value={form.fechaFin}
            onChange={handleChange}
            required
          />
        </div>

        <Textarea
          id="observaciones"
          name="observaciones"
          label="Observaciones"
          value={form.observaciones}
          onChange={handleChange}
          placeholder="Notas adicionales..."
          rows={3}
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Crear Evento
          </Button>
        </div>
      </form>
    </div>
  );
}
