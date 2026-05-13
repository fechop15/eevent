"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs, doc, getDoc } from "@/lib/firebase";
import { Persona, TipoInscripcion, Espacio, Evento, Timestamp, capitalizeName } from "@/types";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

export default function NuevaInscripcionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventoId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [tipos, setTipos] = useState<TipoInscripcion[]>([]);
  const [selectedPersona, setSelectedPersona] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");
  const [evento, setEvento] = useState<Evento | null>(null);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [selectedEspacio, setSelectedEspacio] = useState("");
  const [inscripcionesActivas, setInscripcionesActivas] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const [perSnap, tipoSnap, evtDoc, inscSnap, espSnap] = await Promise.all([
        getDocs(collection("personas")),
        getDocs(collection("tiposInscripcion")),
        getDoc(doc("eventos/" + eventoId)),
        getDocs(collection("inscripciones")),
        getDocs(collection("espacios")),
      ]);
      setPersonas(perSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Persona[]);
      const filteredTipos = (tipoSnap.docs
        .map((d) => ({ id: d.id, ...d.data() })) as TipoInscripcion[]
      ).filter((t) => t.eventoId === eventoId);
      setTipos(filteredTipos);
      if (evtDoc.exists) {
        setEvento({ id: evtDoc.id, ...evtDoc.data() } as Evento);
      }
      const count = inscSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as { eventoId: string; estadoPago: string }))
        .filter((i) => i.eventoId === eventoId && i.estadoPago !== "cancelado").length;
      setInscripcionesActivas(count);
      const filteredEspacios = espSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Espacio))
        .filter((e) => e.eventoId === eventoId);
      setEspacios(filteredEspacios);
    };
    fetchData();
  }, [eventoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (limiteAlcanzado) {
      setError("Se ha alcanzado el límite de inscripciones");
      return;
    }

    if (!selectedPersona || !selectedTipo) {
      setError("Selecciona una persona y un tipo de inscripción");
      return;
    }

    setLoading(true);

    try {
      const tipo = tipos.find((t) => t.id === selectedTipo);
      const valorTotal = tipo?.precio || 0;

      const espacioIdValue = selectedEspacio.trim() || null;

      await addDoc(collection("inscripciones"), {
        eventoId,
        personaId: selectedPersona,
        tipoInscripcionId: selectedTipo,
        espacioId: espacioIdValue,
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
  const limiteAlcanzado = evento?.limiteInscripciones && inscripcionesActivas >= evento.limiteInscripciones;

  return (
    <div className="max-w-2xl">
      <Header
        title="Nueva Inscripción"
        subtitle={
          evento?.limiteInscripciones
            ? `${inscripcionesActivas} de ${evento.limiteInscripciones} inscripciones`
            : `Total de inscripciones: ${inscripcionesActivas}`
        }
        back={{ label: "Volver a Inscripciones", onClick: () => router.push(`/eventos/${eventoId}/inscripciones`) }}
      />

      {limiteAlcanzado && (
        <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-sm text-amber-400">
            <strong>Límite de inscripciones alcanzado.</strong> Este evento tiene un límite de {evento?.limiteInscripciones} inscripciones. No se pueden registrar más hasta que se actualice el límite o se cancele alguna inscripción.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" style={{ opacity: limiteAlcanzado ? 0.5 : 1, pointerEvents: limiteAlcanzado ? "none" : "auto" }}>
        <SearchableSelect
          id="persona"
          label="Persona"
          value={selectedPersona}
          onChange={setSelectedPersona}
          placeholder="Buscar por nombre o cédula..."
          options={[
            { value: "", label: "Seleccionar persona..." },
            ...personas.map((p) => ({
              value: p.id,
              label: `${capitalizeName(p.nombre)} ${capitalizeName(p.apellido)} - ${p.numeroDocumento}`,
            })),
          ]}
        />

        <SearchableSelect
          id="tipo"
          label="Tipo de inscripción"
          value={selectedTipo}
          onChange={setSelectedTipo}
          placeholder="Buscar tipo de inscripción..."
          options={[
            { value: "", label: "Seleccionar tipo..." },
            ...tipos.map((t) => ({
              value: t.id,
              label: `${t.nombre} - $${t.precio.toLocaleString("es-CO")}`,
            })),
          ]}
        />

        {espacios.length > 0 && (
          <SearchableSelect
            id="espacio"
            label="Espacio (opcional)"
            value={selectedEspacio}
            onChange={setSelectedEspacio}
            placeholder="Asignar a un espacio..."
            options={[
              { value: "", label: "Sin espacio" },
              ...espacios.map((e) => ({
                value: e.id,
                label: `${e.nombre} (${e.capacidad - (e._count || 0)} disponibles)`,
              })),
            ]}
          />
        )}

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