"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { getDocs, collection } from "@/lib/firebase";
import { capitalizeName, type Timestamp } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface UsuarioItem {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  estado: string;
  fechaCreacion?: Timestamp;
}

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.rol !== "admin") return;
    setLoading(true);
    getDocs(collection("usuarios"))
      .then((snap) => {
        setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UsuarioItem[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const badgeVariant = (rol: string): "danger" | "info" | "purple" =>
    rol === "admin" ? "danger" : rol === "organizador" ? "info" : "purple";

  return (
    <div>
      <Header title="Configuración" subtitle="Gestión de usuarios y cuenta" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Mi Cuenta</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400">Nombre</p>
              <p className="text-slate-200">{capitalizeName(user.nombre)} {capitalizeName(user.apellido)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Cédula</p>
              <p className="text-slate-200">{user.cedula}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Email</p>
              <p className="text-slate-200">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Rol</p>
              <Badge variant={badgeVariant(user.rol)}>
                {user.rol}
              </Badge>
            </div>
          </div>
        </Card>

        {user.rol === "admin" && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Gestión de Usuarios</h2>
            <p className="text-slate-400 text-sm mb-4">Registra nuevos usuarios en la plataforma.</p>
            <Link href="/usuarios/nuevo">
              <Button variant="secondary">Registrar Usuario</Button>
            </Link>
          </Card>
        )}
      </div>

      {user.rol === "admin" && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Usuarios Registrados</h2>
          {loading ? (
            <p className="text-sm text-slate-400">Cargando...</p>
          ) : usuarios.length === 0 ? (
            <p className="text-sm text-slate-400">No hay usuarios registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-white/10">
                    <th className="pb-3 pr-4 font-medium">Cédula</th>
                    <th className="pb-3 pr-4 font-medium">Nombre</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Rol</th>
                    <th className="pb-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-b border-white/5">
                      <td className="py-3 pr-4 text-slate-200">{u.cedula}</td>
                      <td className="py-3 pr-4 text-slate-200">{capitalizeName(u.nombre)} {capitalizeName(u.apellido)}</td>
                      <td className="py-3 pr-4 text-slate-200">{u.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={badgeVariant(u.rol)}>{u.rol}</Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant={u.estado === "activo" ? "success" : "warning"}>
                          {u.estado}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
