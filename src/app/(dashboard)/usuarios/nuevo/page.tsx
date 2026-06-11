"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Timestamp } from "@/types";

const rolOptions = [
  { value: "admin", label: "Admin" },
  { value: "organizador", label: "Organizador" },
  { value: "contador", label: "Contador" },
];

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authUid, setAuthUid] = useState("");

  const [form, setForm] = useState({
    cedula: "",
    nombre: "",
    apellido: "",
    email: "",
    rol: "organizador" as "admin" | "organizador" | "contador",
    password: "",
  });

  useEffect(() => {
    if (user && user.rol !== "admin") {
      router.replace("/eventos");
    }
  }, [user, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const crearDocFirestore = async (uid: string) => {
    const email = form.email || `${form.cedula}@eevent.com`;
    await window.firebase.firestore().collection("usuarios").doc(uid).set({
      cedula: form.cedula,
      nombre: form.nombre,
      apellido: form.apellido,
      email,
      rol: form.rol,
      estado: "activo",
      fechaCreacion: Timestamp.now(),
      ultimoAcceso: Timestamp.now(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAuthUid("");

    if (!form.cedula || !form.nombre || !form.apellido || !form.password) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const email = form.email || `${form.cedula}@eevent.com`;
      const firebaseUser = await window.firebase.auth().createUserWithEmailAndPassword(email, form.password);
      const uid = firebaseUser.user.uid;
      setAuthUid(uid);

      try {
        await crearDocFirestore(uid);
        router.push("/configuracion");
      } catch (fsErr: unknown) {
        setAuthUid(uid);
        setError(
          `El usuario se creó en Auth (UID: ${uid}) pero no se pudo crear el documento en Firestore. ` +
          "Puedes reintentar crear el documento con el botón de abajo."
        );
      }
    } catch (err: unknown) {
      const errorCode = (err as { code?: string }).code;
      if (errorCode === "auth/email-already-in-use") {
        setError("Esa cédula ya está registrada");
      } else {
        setError((err as { message?: string }).message || "Error al crear el usuario. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetryDoc = async () => {
    if (!authUid) return;
    setError("");
    setLoading(true);
    try {
      await crearDocFirestore(authUid);
      router.push("/configuracion");
    } catch (err: unknown) {
      setError((err as { message?: string }).message || "Error al crear el documento en Firestore.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (user.rol !== "admin") {
    return (
      <div className="max-w-lg">
        <Header title="Acceso denegado" subtitle="Solo administradores pueden registrar usuarios" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Header title="Nuevo Usuario" subtitle="Crear cuenta en la plataforma" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="cedula"
          name="cedula"
          label="Cédula"
          value={form.cedula}
          onChange={handleChange}
          placeholder="123456789"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="nombre"
            name="nombre"
            label="Nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre"
            required
          />
          <Input
            id="apellido"
            name="apellido"
            label="Apellido"
            value={form.apellido}
            onChange={handleChange}
            placeholder="Apellido"
            required
          />
        </div>

        <Input
          id="email"
          name="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="correo@ejemplo.com"
        />

        <Select
          id="rol"
          name="rol"
          label="Rol"
          value={form.rol}
          onChange={handleChange}
          options={rolOptions}
        />

        <Input
          id="password"
          name="password"
          label="Contraseña"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Mínimo 6 caracteres"
          required
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {authUid && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
            <p className="text-sm text-amber-400 font-mono">UID: {authUid}</p>
            <Button type="button" variant="secondary" size="sm" onClick={handleRetryDoc} loading={loading}>
              Reintentar crear documento en Firestore
            </Button>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading && !authUid}>
            Crear Usuario
          </Button>
        </div>
      </form>
    </div>
  );
}
