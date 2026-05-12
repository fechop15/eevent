"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs } from "@/lib/firebase";
import { Persona, TipoInscripcion, Timestamp } from "@/types";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

export default function NuevaInscripcionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventoId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [tipos, setTipos] = useState<TipoInscripcion[]>([]);
  const [selectedPersona, setSelectedPersona] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [perSnap, tipoSnap] = await Promise.all([
        getDocs(collection("personas")),
        getDocs(collection("tiposInscripcion")),
      ]);
      setPersonas(perSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Persona[]);
      const filteredTipos = tipoSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((t) => t.eventoId === eventoId) as TipoInscripcion[];
      setTipos(filteredTipos);
    };
    fetchData();
  }, [eventoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedPersona || !selectedTipo) {
      setError("Selecciona una persona y un tipo de inscripción");
      return;
    }

    setLoading(true);

    try {
      const tipo = tipos.find((t) => t.id === selectedTipo);
      const valorTotal = tipo?.precio || 0;

      await addDoc(collection("inscripciones"), {
        eventoId,
        personaId: selectedPersona,
        tipoInscripcionId: selectedTipo,
        estadoPago: "pendiente",
        valorTotal,
        valorAbono: 0,
        valorRestante: valorTotal,
        fechaCreacion: Timestamp.now(),
        fechaActualizacion: Timestamp.now(),
      });

      router.push(`/eventos/${eventoId}`);
    } catch (err) {
      console.error("Error creando inscripción:", err);
      setError("Error al crear la inscripción");
    } finally {
      setLoading(false);
    }
  };

  const selectedTipoData = tipos.find((t) => t.id === selectedTipo);

  return (
    <div className="max-w-2xl">
      <Header title="Nueva Inscripción" subtitle="Registrar una nueva inscripción" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Select
          id="persona"
          label="Persona"
          value={selectedPersona}
          onChange={(e) => setSelectedPersona(e.target.value)}
          options={[
            { value: "", label: "Seleccionar persona..." },
            ...personas.map((p) => ({
              value: p.id,
              label: `${p.nombre} ${p.apellido} - ${p.tipoDocumento} ${p.numeroDocumento}`,
            })),
          ]}
        />

        <Select
          id="tipo"
          label="Tipo de inscripción"
          value={selectedTipo}
          onChange={(e) => setSelectedTipo(e.target.value)}
          options={[
            { value: "", label: "Seleccionar tipo..." },
            ...tipos.map((t) => ({
              value: t.id,
              label: `${t.nombre} - $${t.precio.toLocaleString("es-CO")}`,
            })),
          ]}
        />

        {selectedTipoData && (
          <div className="p-4 bg-slate-800/50 rounded-lg border border-white/10">
            <p className="text-sm text-slate-400 mb-1">Precio</p>
            <p className="text-xl font-bold text-slate-100">
              ${selectedTipoData.precio.toLocaleString("es-CO")}
            </p>
            {selectedTipoData.descripcion && (
              <p className="text-sm text-slate-400 mt-2">{selectedTipoData.descripcion}</p>
            )}
          </div>
        )}

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
            Crear Inscripción
          </Button>
        </div>
      </form>
    </div>
  );
}