"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "@/lib/firebase";
import { Inscripcion, Persona, TipoInscripcion } from "@/types";
import { capitalizeName } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { doc, updateDoc } from "@/lib/firebase";
import { Timestamp } from "@/types";

const estadoPagoColors: Record<string, "default" | "success" | "warning" | "danger"> = {
  pendiente: "danger",
  abono: "warning",
  pagado: "success",
  cancelado: "default",
};

export default function InscripcionesEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventoId } = use(params);
  const router = useRouter();
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [personas, setPersonas] = useState<Record<string, Persona>>({});
  const [tipos, setTipos] = useState<Record<string, TipoInscripcion>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [inscripcionToCancel, setInscripcionToCancel] = useState<Inscripcion | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inscSnap, perSnap, tipSnap] = await Promise.all([
          getDocs(collection("inscripciones")),
          getDocs(collection("personas")),
          getDocs(collection("tiposInscripcion")),
        ]);
        const filtered = (inscSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() })) as Inscripcion[]
        ).filter((i) => i.eventoId === eventoId);
        setInscripciones(filtered);
        const personasMap: Record<string, Persona> = {};
        perSnap.docs.forEach((doc) => {
          personasMap[doc.id] = { id: doc.id, ...doc.data() } as Persona;
        });
        setPersonas(personasMap);
        const tiposMap: Record<string, TipoInscripcion> = {};
        tipSnap.docs.forEach((doc) => {
          tiposMap[doc.id] = { id: doc.id, ...doc.data() } as TipoInscripcion;
        });
        setTipos(tiposMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventoId]);

  const filteredInscripciones = inscripciones.filter((insc) => {
    const persona = personas[insc.personaId];
    const nombreCompleto = `${persona?.nombre || ""} ${persona?.apellido || ""} ${persona?.numeroDocumento || ""}`.toLowerCase();
    const matchesSearch = nombreCompleto.includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === "todos" || insc.estadoPago === filterEstado;
    const matchesTipo = filterTipo === "todos" || insc.tipoInscripcionId === filterTipo;
    return matchesSearch && matchesEstado && matchesTipo;
  });

  const handleCancelar = async () => {
    if (!inscripcionToCancel) return;
    setCancelling(true);
    try {
      await updateDoc(doc("inscripciones/" + inscripcionToCancel.id), {
        estadoPago: "cancelado",
        fechaActualizacion: Timestamp.now(),
      });
      setInscripciones((prev) =>
        prev.map((i) =>
          i.id === inscripcionToCancel.id ? { ...i, estadoPago: "cancelado" } : i
        )
      );
      setShowCancelModal(false);
      setInscripcionToCancel(null);
    } catch (error) {
      console.error("Error cancelando inscripción:", error);
    } finally {
      setCancelling(false);
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
        title="Inscripciones"
        subtitle={`Total: ${filteredInscripciones.length} de ${inscripciones.length}`}
        back={{
          label: "Volver al evento",
          onClick: () => router.push(`/eventos/${eventoId}`),
        }}
        action={{
          label: "+ Nueva Inscripción",
          onClick: () => router.push(`/eventos/${eventoId}/inscripciones/nueva`),
        }}
      />

<div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary w-72"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 mr-1">Estado:</span>
          {["todos", "pendiente", "abono", "pagado", "cancelado"].map((estado) => (
            <button
              key={estado}
              onClick={() => setFilterEstado(estado)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterEstado === estado
                  ? estado === "pendiente" ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : estado === "abono" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : estado === "pagado" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : estado === "cancelado" ? "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                  : "bg-primary/20 text-primary border border-primary/30"
                  : "bg-slate-800 text-slate-400 border border-white/5"
              }`}
            >
              {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 mr-1">Tipo:</span>
          <button
            onClick={() => setFilterTipo("todos")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterTipo === "todos"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-slate-800 text-slate-400 border border-white/5"
            }`}
          >
            Todos
          </button>
          {Object.values(tipos)
            .filter((t) => t.eventoId === eventoId)
            .map((tipo) => (
              <button
                key={tipo.id}
                onClick={() => setFilterTipo(tipo.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterTipo === tipo.id
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-slate-800 text-slate-400 border border-white/5"
                }`}
              >
                {tipo.nombre}
              </button>
            ))}
        </div>
      </div>

      {filteredInscripciones.length === 0 ? (
        <EmptyState
          title={searchTerm || filterEstado !== "todos" ? "Sin resultados" : "No hay inscripciones"}
          description={searchTerm || filterEstado !== "todos" ? "Intenta con otro filtro o término de búsqueda." : "Registra la primera inscripción."}
          action={
            <Button onClick={() => { setSearchTerm(""); setFilterEstado("todos"); setFilterTipo("todos"); }}>
              {searchTerm || filterEstado !== "todos" || filterTipo !== "todos" ? "Limpiar filtros" : "Nueva Inscripción"}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Abono</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Restante</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInscripciones.map((insc) => (
                <tr
                  key={insc.id}
                  className="border-b border-white/5 transition-colors"
                  onClick={() => router.push(`/eventos/${eventoId}/inscripciones/${insc.id}/pagos`)}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-slate-100">
                      {capitalizeName(personas[insc.personaId]?.nombre)} {capitalizeName(personas[insc.personaId]?.apellido)}
                    </span>
                    <br />
                    <span className="text-xs text-slate-500">{personas[insc.personaId]?.numeroDocumento || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-100">{tipos[insc.tipoInscripcionId]?.nombre || "—"}</span>
                    <br />
                    <span className="text-xs text-slate-500">{formatCurrency(tipos[insc.tipoInscripcionId]?.precio || 0)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={estadoPagoColors[insc.estadoPago] || "default"}>
                      {insc.estadoPago.charAt(0).toUpperCase() + insc.estadoPago.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-emerald-400">
                    {formatCurrency(insc.valorAbono)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-amber-400">
                    {formatCurrency(insc.valorRestante)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/eventos/${eventoId}/inscripciones/${insc.id}/pagos`);
                        }}
                      >
                        Ver
                      </Button>
                      {insc.estadoPago !== "cancelado" && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInscripcionToCancel(insc);
                            setShowCancelModal(true);
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                      {insc.valorRestante > 0 && insc.estadoPago !== "pagado" && insc.estadoPago !== "cancelado" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/eventos/${eventoId}/inscripciones/${insc.id}/pagos`);
                          }}
                        >
                          Registrar Pago
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancelar Inscripción">
        <div className="space-y-4">
          <p className="text-slate-300">
            ¿Estás seguro de que deseas cancelar la inscripción de{" "}
            <span className="font-semibold text-slate-100">
              {capitalizeName(personas[inscripcionToCancel?.personaId || ""]?.nombre)} {capitalizeName(personas[inscripcionToCancel?.personaId || ""]?.apellido)}
            </span>
            ?
          </p>
          <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              No, mantener
            </Button>
            <Button variant="danger" onClick={handleCancelar} loading={cancelling}>
              Sí, cancelar inscripción
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}