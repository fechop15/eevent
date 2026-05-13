"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, updateDoc, doc } from "@/lib/firebase";
import { Espacio, Inscripcion, Persona, Timestamp } from "@/types";
import { capitalizeName } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function EspacioDetallePage({ params }: { params: Promise<{ id: string; espacioId: string }> }) {
  const { id: eventoId, espacioId } = use(params);
  const router = useRouter();
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [todasInscripciones, setTodasInscripciones] = useState<Inscripcion[]>([]);
  const [personas, setPersonas] = useState<Record<string, Persona>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRespModal, setShowRespModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [espDoc, inscSnap, perSnap] = await Promise.all([
          doc("espacios/" + espacioId),
          getDocs(collection("inscripciones")),
          getDocs(collection("personas")),
        ]);

        const espSnap = await import("@/lib/firebase").then((m) => m.getDoc(espDoc));
        if (espSnap.exists) {
          setEspacio({ id: espSnap.id, ...espSnap.data() } as Espacio);
        }

        const activas = inscSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Inscripcion))
          .filter((i) => i.eventoId === eventoId && i.estadoPago !== "cancelado");
        setTodasInscripciones(activas);

        const personasMap: Record<string, Persona> = {};
        perSnap.docs.forEach((d) => {
          personasMap[d.id] = { id: d.id, ...d.data() } as Persona;
        });
        setPersonas(personasMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventoId, espacioId]);

  const InscripcionesEnEspacio = todasInscripciones.filter((i) => i.espacioId === espacioId);
  const disponibles = todasInscripciones.filter(
    (i) => !i.espacioId && espacio && InscripcionesEnEspacio.length < espacio.capacidad
  );

  const handleAsignar = async (inscripcionId: string) => {
    setSubmitting(true);
    try {
      await updateDoc(doc("inscripciones/" + inscripcionId), {
        espacioId,
        fechaActualizacion: Timestamp.now(),
      });
      setTodasInscripciones((prev) =>
        prev.map((i) => (i.id === inscripcionId ? { ...i, espacioId } : i))
      );
      setShowAddModal(false);
    } catch (error) {
      console.error("Error assigning espacio:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuitar = async (inscripcionId: string) => {
    try {
      await updateDoc(doc("inscripciones/" + inscripcionId), {
        espacioId: null,
        fechaActualizacion: Timestamp.now(),
      });
      setTodasInscripciones((prev) =>
        prev.map((i) => (i.id === inscripcionId ? { ...i, espacioId: null } : i))
      );
    } catch (error) {
      console.error("Error removing espacio:", error);
    }
  };

  const handleAsignarResponsable = async (personaId: string) => {
    if (!espacio) return;
    setSubmitting(true);
    try {
      await updateDoc(doc("espacios/" + espacioId), {
        responsableId: personaId,
        fechaActualizacion: Timestamp.now(),
      });
      setEspacio((prev) => prev ? { ...prev, responsableId: personaId } : prev);
      setShowRespModal(false);
    } catch (error) {
      console.error("Error assigning responsable:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuitarResponsable = async () => {
    try {
      await updateDoc(doc("espacios/" + espacioId), {
        responsableId: null,
        fechaActualizacion: Timestamp.now(),
      });
      setEspacio((prev) => prev ? { ...prev, responsableId: null } : prev);
      setShowRespModal(false);
    } catch (error) {
      console.error("Error removing responsable:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!espacio) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Espacio no encontrado</p>
      </div>
    );
  }

  const responsable = espacio.responsableId ? personas[espacio.responsableId] : null;
  const completo = InscripcionesEnEspacio.length >= espacio.capacidad;

  return (
    <div>
      <Header
        title={espacio.nombre}
        subtitle={`${InscripcionesEnEspacio.length} de ${espacio.capacidad} lugares`}
        back={{ label: "Volver a Espacios", onClick: () => router.push(`/eventos/${eventoId}/espacios`) }}
        action={{
          label: completo ? "Espacio lleno" : "+ Asignar Inscrito",
          onClick: () => setShowAddModal(true),
          disabled: completo,
          variant: completo ? "secondary" : "primary",
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-1">Capacidad</p>
          <p className="text-2xl font-bold text-slate-100">{espacio.capacidad}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-1">Asignados</p>
          <p className="text-2xl font-bold text-primary">{InscripcionesEnEspacio.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-1">Disponibles</p>
          <p className={`text-2xl font-bold ${espacio.capacidad - InscripcionesEnEspacio.length > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {espacio.capacidad - InscripcionesEnEspacio.length}
          </p>
        </Card>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-3 mb-8">
        <div
          className={`h-3 rounded-full transition-all ${completo ? "bg-red-500" : "bg-primary"}`}
          style={{ width: `${Math.min(100, (InscripcionesEnEspacio.length / espacio.capacidad) * 100)}%` }}
        />
      </div>

      {responsable && (
        <Card className="p-5 mb-8 border-2 border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary font-semibold mb-1">RESPONSABLE DEL ESPACIO</p>
              <p className="text-lg font-semibold text-slate-100">
                {capitalizeName(responsable.nombre)} {capitalizeName(responsable.apellido)}
              </p>
              <p className="text-sm text-slate-400">{responsable.numeroDocumento}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowRespModal(true)}>
              Cambiar
            </Button>
          </div>
        </Card>
      )}

      {!responsable && InscripcionesEnEspacio.length > 0 && (
        <div className="mb-8">
          <Button variant="secondary" onClick={() => setShowRespModal(true)}>
            Asignar responsable
          </Button>
        </div>
      )}

      {InscripcionesEnEspacio.length === 0 ? (
        <EmptyState
          title="No hay inscritos asignados"
          description="Asigna personas a este espacio."
          action={
            <Button onClick={() => setShowAddModal(true)} disabled={completo}>
              Asignar Inscrito
            </Button>
          }
        />
      ) : (
        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Persona</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {InscripcionesEnEspacio.map((insc) => {
                const persona = personas[insc.personaId];
                const isResponsable = insc.personaId === espacio.responsableId;
                return (
                  <tr key={insc.id} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-100">
                            {persona ? `${capitalizeName(persona.nombre)} ${capitalizeName(persona.apellido)}` : "—"}
                          </p>
                          <p className="text-xs text-slate-500">{persona?.numeroDocumento || "—"}</p>
                        </div>
                        {isResponsable && (
                          <Badge variant="primary">★ Responsable</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {persona ? insc.personaId.slice(0, 8) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isResponsable && (
                          <Button variant="ghost" size="sm" onClick={() => setShowRespModal(true)}>
                            Hacer responsable
                          </Button>
                        )}
                        <Button variant="danger" size="sm" onClick={() => handleQuitar(insc.id)}>
                          Quitar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Asignar Inscrito">
        {disponibles.length === 0 ? (
          <div className="space-y-4">
            <p className="text-slate-300">No hay inscritos disponibles para asignar.</p>
            <p className="text-sm text-slate-500">
              {completo
                ? "El espacio está completo."
                : "Todos los inscritos ya tienen un espacio asignado."}
            </p>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {disponibles.map((insc) => {
              const persona = personas[insc.personaId];
              return (
                <button
                  key={insc.id}
                  onClick={() => handleAsignar(insc.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-800 transition-colors border border-white/5"
                >
                  <p className="text-sm font-medium text-slate-100">
                    {persona ? `${capitalizeName(persona.nombre)} ${capitalizeName(persona.apellido)}` : "—"}
                  </p>
                  <p className="text-xs text-slate-500">{persona?.numeroDocumento || "—"}</p>
                </button>
              );
            })}
          </div>
        )}
      </Modal>

      <Modal isOpen={showRespModal} onClose={() => setShowRespModal(false)} title="Asignar Responsable">
        {responsable ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Responsable actual: <span className="text-slate-200 font-medium">{capitalizeName(responsable.nombre)} {capitalizeName(responsable.apellido)}</span>
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {InscripcionesEnEspacio.map((insc) => {
                const persona = personas[insc.personaId];
                const isCurrent = insc.personaId === responsable.id;
                return (
                  <button
                    key={insc.id}
                    onClick={() => handleAsignarResponsable(insc.personaId)}
                    className={`w-full text-left p-3 rounded-lg transition-colors border ${
                      isCurrent
                        ? "border-primary bg-primary/10"
                        : "border-white/5 hover:bg-slate-800"
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-100">
                      {persona ? `${capitalizeName(persona.nombre)} ${capitalizeName(persona.apellido)}` : "—"}
                      {isCurrent && " (actual)"}
                    </p>
                    <p className="text-xs text-slate-500">{persona?.numeroDocumento || "—"}</p>
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleQuitarResponsable}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Quitar responsable
            </button>
          </div>
        ) : InscripcionesEnEspacio.length === 0 ? (
          <p className="text-slate-400 text-sm">Primero asigna inscritos a este espacio para poder designar un responsable.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {InscripcionesEnEspacio.map((insc) => {
              const persona = personas[insc.personaId];
              return (
                <button
                  key={insc.id}
                  onClick={() => handleAsignarResponsable(insc.personaId)}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-800 transition-colors border border-white/5"
                >
                  <p className="text-sm font-medium text-slate-100">
                    {persona ? `${capitalizeName(persona.nombre)} ${capitalizeName(persona.apellido)}` : "—"}
                  </p>
                  <p className="text-xs text-slate-500">{persona?.numeroDocumento || "—"}</p>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}