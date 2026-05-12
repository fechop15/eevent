"use client";

import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function ConfiguracionPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <Header title="Configuración" subtitle="Gestión de usuarios y cuenta" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Mi Cuenta</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400">Nombre</p>
              <p className="text-slate-200">{user.nombre} {user.apellido}</p>
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
              <Badge variant={user.rol === "admin" ? "danger" : user.rol === "organizador" ? "info" : "purple"}>
                {user.rol}
              </Badge>
            </div>
          </div>
        </Card>

        {user.rol === "admin" && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Gestión de Usuarios</h2>
            <p className="text-slate-400 text-sm">La gestión completa de usuarios estará disponible pronto.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
