"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs } from "@/lib/firebase";
import { TipoInscripcion, Evento, Timestamp } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ConfiguracionEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventoId } = use(params);
  const router = useRouter();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [tipos, setTipos] = useState<TipoInscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLimiteModal, setShowLimiteModal] = useState(false);
  const [form, setForm] = useState({ nombre: "", precio: "", descripcion: "" });
  const [limiteForm, setLimiteForm] = useState({ limiteInscripciones: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evtDoc, tipSnap] = await Promise.all([
          getDoc(doc("eventos/" + eventoId)),
          getDocs(collection("tiposInscripcion")),
        ]);
        if (evtDoc.exists) {
          setEvento({ id: evtDoc.id, ...evtDoc.data() } as Evento);
          setLimiteForm({ limiteInscripciones: evtDoc.data().limiteInscripciones?.toString() || "" });
        }
        const filtered = tipSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as { id: string; eventoId: string; nombre: string; precio: number; descripcion: string; limite?: number; fechaCreacion: Date | Record<string, unknown> }))
          .filter((t) => t.eventoId === eventoId);
        setTipos(filtered);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
        .map((doc) => ({ id: doc.id, ...doc.data() } as { id: string; eventoId: string; nombre: string; precio: number; descripcion: string; fechaCreacion: Date | Record<string, unknown> }))
        .filter((t) => t.eventoId === eventoId);
      setTipos(filtered);
    } catch (error) {
      console.error("Error saving tipo:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveLimite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const limite = limiteForm.limiteInscripciones.trim() === "" ? null : parseInt(limiteForm.limiteInscripciones);
      await updateDoc(doc("eventos/" + eventoId), {
        limiteInscripciones: limite,
        fechaActualizacion: Timestamp.now(),
      });
      setEvento((prev) => prev ? { ...prev, limiteInscripciones: limite as number | undefined } : prev);
      setShowLimiteModal(false);
    } catch (error) {
      console.error("Error saving limite:", error);
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
        back={{ label: "Volver al evento", onClick: () => router.push(`/eventos/${eventoId}`) }}
      />

      <Card className="p-5 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100 mb-1">Límite de Inscripciones</h2>
            <p className="text-sm text-slate-400">
              {evento?.limiteInscripciones
                ? `Límite: ${evento.limiteInscripciones} inscripciones`
                : "Sin límite definido (ilimitado)"}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowLimiteModal(true)}>
            {evento?.limiteInscripciones ? "Editar" : "Definir límite"}
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-100">Tipos de Inscripción</h2>
        <Button size="sm" onClick={() => setShowModal(true)}>+ Nuevo Tipo</Button>
      </div>

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

      <Modal isOpen={showLimiteModal} onClose={() => setShowLimiteModal(false)} title="Límite de Inscripciones">
        <form onSubmit={handleSaveLimite} className="space-y-4">
          <p className="text-sm text-slate-400">
            Define un número máximo de inscripciones para este evento. Deja el campo vacío para permitir inscripciones ilimitadas.
          </p>
          <Input
            id="limite"
            label="Límite de inscripciones"
            type="number"
            value={limiteForm.limiteInscripciones}
            onChange={(e) => setLimiteForm({ limiteInscripciones: e.target.value })}
            placeholder="Ej: 100 (déjalo vacío para ilimitado)"
            min="1"
          />
          {evento?.limiteInscripciones && (
            <button
              type="button"
              onClick={async () => {
                setSubmitting(true);
                try {
                  await updateDoc(doc("eventos/" + eventoId), {
                    limiteInscripciones: null,
                    fechaActualizacion: Timestamp.now(),
                  });
                  setEvento((prev) => prev ? { ...prev, limiteInscripciones: undefined } : prev);
                  setLimiteForm({ limiteInscripciones: "" });
                  setShowLimiteModal(false);
                } catch (error) {
                  console.error("Error removing limite:", error);
                } finally {
                  setSubmitting(false);
                }
              }}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Quitar límite (inscripciones ilimitadas)
            </button>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowLimiteModal(false)}>
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