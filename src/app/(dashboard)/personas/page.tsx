"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "@/lib/firebase";
import { Persona } from "@/types";
import { capitalizeName } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function PersonasPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const snapshot = await getDocs(collection("personas"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Persona[];
        setPersonas(data);
      } catch (error) {
        console.error("Error fetching personas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonas();
  }, []);

  const filteredPersonas = personas.filter((persona) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      persona.nombre.toLowerCase().includes(term) ||
      persona.apellido.toLowerCase().includes(term) ||
      persona.numeroDocumento.includes(term)
    );
  });

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
        title="Personas"
        subtitle="Base de datos de contactos"
        action={{
          label: "+ Nueva Persona",
          onClick: () => router.push("/personas/nueva"),
        }}
      />

      <Card className="p-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o número de documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 outline-none focus:border-primary"
        />
      </Card>

      {filteredPersonas.length === 0 ? (
        <EmptyState
          title="No hay personas"
          description="Agrega tu primera persona a la base de datos."
          action={
            <Button onClick={() => router.push("/personas/nueva")}>Agregar Persona</Button>
          }
        />
      ) : (
        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Contacto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersonas.map((persona) => (
                <tr
                  key={persona.id}
                  className="border-b border-white/5 hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/personas/${persona.id}`)}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-100">
                      {capitalizeName(persona.nombre)} {capitalizeName(persona.apellido)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-400">{persona.tipoDocumento} {persona.numeroDocumento}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-400">{persona.email || persona.telefono || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/personas/${persona.id}`);
                      }}
                    >
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}