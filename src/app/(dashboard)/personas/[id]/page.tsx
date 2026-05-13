"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs } from "@/lib/firebase";
import { Persona, Inscripcion, formatTimestamp, capitalizeName } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const sexoLabels: Record<string, string> = {
  M: "Masculino",
  F: "Femenino",
  O: "Otro",
};

export default function PersonaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc("personas/" + id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists) {
          setPersona({ id: docSnap.id, ...docSnap.data() } as Persona);
        }

        const allInscrSnap = await getDocs(collection("inscripciones"));
        const filteredInscr = allInscrSnap.docs
          .filter((d) => d.data().personaId === id)
          .map((doc) => ({ id: doc.id, ...doc.data() })) as Inscripcion[];
        setInscripciones(filteredInscr);
      } catch (error) {
        console.error("Error fetching persona:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Persona no encontrada</p>
        <Button onClick={() => router.push("/personas")} className="mt-4">
          Volver a personas
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={`${capitalizeName(persona.nombre)} ${capitalizeName(persona.apellido)}`}
        subtitle={`${persona.tipoDocumento} ${persona.numeroDocumento}`}
        action={{
          label: "Editar",
          onClick: () => router.push(`/personas/${id}`),
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Información Personal</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Fecha de nacimiento</p>
                <p className="text-slate-200">{formatTimestamp(persona.fechaNacimiento)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Sexo</p>
                <p className="text-slate-200">{sexoLabels[persona.sexo]}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Teléfono</p>
                <p className="text-slate-200">{persona.telefono || "No disponible"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Email</p>
                <p className="text-slate-200">{persona.email || "No disponible"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-slate-400 mb-1">Dirección</p>
                <p className="text-slate-200">{persona.direccion || "No disponible"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Historial de Inscripciones</h2>
            {inscripciones.length === 0 ? (
              <p className="text-slate-500">No tiene inscripciones registradas</p>
            ) : (
              <div className="space-y-3">
                {inscripciones.map((insc) => (
                  <div key={insc.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-slate-200">Evento ID: {insc.eventoId}</span>
                    <Badge
                      variant={
                        insc.estadoPago === "pagado"
                          ? "success"
                          : insc.estadoPago === "abono"
                          ? "warning"
                          : "danger"
                      }
                    >
                      {insc.estadoPago}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Notas</h2>
            <p className="text-slate-400 text-sm">{persona.observaciones || "Sin observaciones"}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}