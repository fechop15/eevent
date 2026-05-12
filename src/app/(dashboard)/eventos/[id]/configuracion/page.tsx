"use client";

import { useState, useEffect, use } from "react";
import { collection, addDoc, getDocs } from "@/lib/firebase";
import { TipoInscripcion } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ConfiguracionEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventoId } = use(params);
  const [tipos, setTipos] = useState<TipoInscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nombre: "", precio: "", descripcion: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const snapshot = await getDocs(collection("tiposInscripcion"));
        const filtered = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
.filter((t) => t.eventoId === eventoId) as TipoInscripcion[];
        setTipos(filtered);
      } catch (error) {
        console.error("Error fetching tipos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTipos();
  }, [eventoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection("tiposInscripcion"), {
        nombre: form.nombre,
        precio: parseFloat(form.precio),
        descripcion: form.descripcion,
        eventoId,
        fechaCreacion: new Date(),
      });
      setShowModal(false);
      setForm({ nombre: "", precio: "", descripcion: "" });
      const snapshot = await getDocs(collection("tiposInscripcion"));
      const filtered = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((t) => t.eventoId === eventoId) as TipoInscripcion[];
      setTipos(filtered);
    } catch (error) {
      console.error("Error saving tipo:", error);
    } finally {
      setSubmitting(false);
    }
  };

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
        title="Configuración del Evento"
        subtitle="Tipos de inscripción"
        action={{ label: "+ Nuevo Tipo", onClick: () => setShowModal(true) }}
      />

      {tipos.length === 0 ? (
        <EmptyState
          title="No hay tipos de inscripción"
          description="Crea los tipos de inscripción disponibles para este evento."
          action={<Button onClick={() => setShowModal(true)}>Crear Tipo</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tipos.map((tipo) => (
            <Card key={tipo.id} className="p-5">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">{tipo.nombre}</h3>
              <p className="text-2xl font-bold text-primary mb-2">{formatCurrency(tipo.precio)}</p>
              {tipo.descripcion && <p className="text-sm text-slate-400">{tipo.descripcion}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Tipo de Inscripción">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="nombre"
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Ej: General, VIP, Estudiante"
            required
          />
          <Input
            id="precio"
            label="Precio (COP)"
            type="number"
            value={form.precio}
            onChange={(e) => setForm((p) => ({ ...p, precio: e.target.value }))}
            placeholder="50000"
            required
          />
          <Textarea
            id="descripcion"
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Detalles adicionales..."
            rows={3}
          />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}