"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "@/lib/firebase";
import { Espacio, Persona, Timestamp, Inscripcion, capitalizeName } from "@/types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";

export default function EspaciosEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventoId } = use(params);
  const router = useRouter();
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [personas, setPersonas] = useState<Record<string, Persona>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEspacio, setEditingEspacio] = useState<Espacio | null>(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", capacidad: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [espSnap, inscSnap, perSnap] = await Promise.all([
          getDocs(collection("espacios")),
          getDocs(collection("inscripciones")),
          getDocs(collection("personas")),
        ]);
        const filtered = espSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Espacio))
          .filter((e) => e.eventoId === eventoId)
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        setEspacios(filtered);

        const activas = inscSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as unknown as Inscripcion))
          .filter((i) => i.eventoId === eventoId && i.estadoPago !== "cancelado");
        setInscripciones(activas);

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
  }, [eventoId]);

  const getInscripcionesEnEspacio = (espacioId: string) =>
    inscripciones.filter((i) => i.espacioId === espacioId);

  const getDisponible = (espacio: Espacio) =>
    espacio.capacidad - getInscripcionesEnEspacio(espacio.id).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.capacidad) return;
    setSubmitting(true);
    try {
      const data = {
        eventoId,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        capacidad: parseInt(form.capacidad),
        responsableId: null,
        fechaCreacion: Timestamp.now(),
        fechaActualizacion: Timestamp.now(),
      };

      if (editingEspacio) {
        await updateDoc(doc("espacios/" + editingEspacio.id), {
          nombre: data.nombre,
          descripcion: data.descripcion,
          capacidad: data.capacidad,
          fechaActualizacion: Timestamp.now(),
        });
        setEspacios((prev) =>
          prev.map((e) =>
            e.id === editingEspacio.id
              ? { ...e, nombre: data.nombre, descripcion: data.descripcion, capacidad: data.capacidad }
              : e
          )
        );
      } else {
        const docRef = await addDoc(collection("espacios"), data);
        setEspacios((prev) => [
          ...prev,
          { id: docRef.id, ...data } as Espacio,
        ]);
      }
      closeModal();
    } catch (error) {
      console.error("Error saving espacio:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (espacioId: string) => {
    try {
      await deleteDoc(doc("espacios/" + espacioId));
      setEspacios((prev) => prev.filter((e) => e.id !== espacioId));
    } catch (error) {
      console.error("Error deleting espacio:", error);
    }
  };

  const openEdit = (espacio: Espacio) => {
    setEditingEspacio(espacio);
    setForm({ nombre: espacio.nombre, descripcion: espacio.descripcion, capacidad: espacio.capacidad.toString() });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEspacio(null);
    setForm({ nombre: "", descripcion: "", capacidad: "" });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    doc.setFontSize(16);
    doc.setTextColor(30, 30, 30);
    doc.text("Resumen de Espacios", 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-CO")}`, 14, 22);

    const tableBody: (string | number)[][] = [];
    let num = 1;

    espacios.forEach((espacio) => {
      const enEspacio = getInscripcionesEnEspacio(espacio.id);
      const resp = espacio.responsableId && personas[espacio.responsableId]
        ? `${capitalizeName(personas[espacio.responsableId].nombre)} ${capitalizeName(personas[espacio.responsableId].apellido)}`
        : "—";

      if (enEspacio.length === 0) {
        tableBody.push([num, espacio.nombre, resp, espacio.capacidad, 0, "Sin inscritos"]);
        num++;
      } else {
        enEspacio.forEach((insc, i) => {
          const p = personas[insc.personaId];
          tableBody.push([
            num,
            i === 0 ? espacio.nombre : "",
            i === 0 ? resp : "",
            i === 0 ? espacio.capacidad : "",
            i === 0 ? enEspacio.length : "",
            p ? `${capitalizeName(p.nombre)} ${capitalizeName(p.apellido)}` : "—",
            p?.numeroDocumento || "—",
          ]);
          num++;
        });
      }
    });

    autoTable(doc, {
      startY: 28,
      head: [["#", "Espacio", "Responsable", "Capacidad", "Asignados", "Nombre", "Cédula"]],
      body: tableBody,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: "auto" },
        6: { cellWidth: 40 },
      },
    });

    doc.save("espacios-inscritos.pdf");
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
        title="Espacios"
        subtitle={`${espacios.length} espacios`}
        back={{ label: "Volver al evento", onClick: () => router.push(`/eventos/${eventoId}`) }}
        action={{ label: "+ Nuevo Espacio", onClick: () => { setEditingEspacio(null); setForm({ nombre: "", descripcion: "", capacidad: "" }); setShowModal(true); } }}
      />

      {espacios.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button variant="secondary" onClick={handleExportPDF}>
            Exportar PDF
          </Button>
        </div>
      )}

      {espacios.length === 0 ? (
        <EmptyState
          title="No hay espacios"
          description="Crea los espacios disponibles para este evento."
          action={<Button onClick={() => setShowModal(true)}>Crear Espacio</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {espacios.map((espacio) => {
            const enEspacio = getInscripcionesEnEspacio(espacio.id);
            const disponible = getDisponible(espacio);
            const completo = disponible <= 0;
            return (
              <Card key={espacio.id} className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">{espacio.nombre}</h3>
                    {espacio.descripcion && (
                      <p className="text-sm text-slate-400 mt-1">{espacio.descripcion}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(espacio)}
                      className="text-slate-500 hover:text-primary transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(espacio.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold ${completo ? "text-red-400" : "text-emerald-400"}`}>
                    {enEspacio.length}/{espacio.capacidad}
                  </div>
                  <div className="text-sm text-slate-400">
                    {completo ? "Completo" : `${disponible} disponibles`}
                  </div>
                </div>

                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${completo ? "bg-red-500" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, (enEspacio.length / espacio.capacidad) * 100)}%` }}
                  />
                </div>

                {espacio.responsableId && personas[espacio.responsableId] ? (
                  <div className="mt-2 p-3 bg-slate-800/50 rounded-lg border border-white/5">
                    <p className="text-xs text-slate-500 mb-1">Responsable</p>
                    <p className="text-sm font-medium text-slate-200">
                      {personas[espacio.responsableId].nombre} {personas[espacio.responsableId].apellido}
                    </p>
                  </div>
                ) : enEspacio.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 mb-2">Inscritos</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {enEspacio.slice(0, 5).map((insc) => (
                        <div key={insc.id} className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">
                            {personas[insc.personaId]?.nombre} {personas[insc.personaId]?.apellido?.charAt(0)}.
                          </span>
                          {insc.personaId === espacio.responsableId && (
                            <span className="text-xs text-primary">★ Responsable</span>
                          )}
                        </div>
                      ))}
                      {enEspacio.length > 5 && (
                        <p className="text-xs text-slate-500">+{enEspacio.length - 5} más</p>
                      )}
                    </div>
                  </div>
                ) : null}

                {!completo && enEspacio.length === 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/eventos/${eventoId}/espacios/${espacio.id}`)}
                  >
                    Asignar Inscritos
                  </Button>
                )}
                {enEspacio.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/eventos/${eventoId}/espacios/${espacio.id}`)}
                    >
                      Gestionar
                    </Button>
                    {!completo && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/eventos/${eventoId}/espacios/${espacio.id}`)}
                      >
                        + Asignar
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={closeModal} title={editingEspacio ? "Editar Espacio" : "Nuevo Espacio"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="nombre"
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Ej: Salon A, Cancha principal"
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
            id="capacidad"
            label="Capacidad"
            type="number"
            value={form.capacidad}
            onChange={(e) => setForm((p) => ({ ...p, capacidad: e.target.value }))}
            placeholder="Ej: 50"
            required
            min="1"
          />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {editingEspacio ? "Guardar Cambios" : "Crear Espacio"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}