"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection } from "@/lib/firebase";
import { Timestamp } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Textarea } from "@/components/ui/Textarea";

const tipoDocumentoOptions = [
  { value: "CC", label: "Cédula de Ciudadanía (CC)" },
  { value: "TI", label: "Tarjeta de Identidad (TI)" },
  { value: "CE", label: "Cédula de Extranjería (CE)" },
  { value: "RC", label: "Registro Civil (RC)" },
  { value: "NIT", label: "NIT" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "NIUP", label: "NIUP" },
];

const sexoOptions = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
  { value: "O", label: "Otro" },
];

export default function NuevaPersonaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    tipoDocumento: "CC",
    numeroDocumento: "",
    fechaNacimiento: "",
    sexo: "M",
    telefono: "",
    email: "",
    direccion: "",
    observaciones: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.nombre || !form.apellido || !form.numeroDocumento) {
      setError("Los campos obligatorios son requeridos");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection("personas"), {
        nombre: form.nombre,
        apellido: form.apellido,
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento,
        fechaNacimiento: form.fechaNacimiento ? Timestamp.now() : null,
        sexo: form.sexo,
        telefono: form.telefono,
        email: form.email,
        direccion: form.direccion,
        observaciones: form.observaciones,
        creadoPor: user?.uid,
        fechaCreacion: Timestamp.now(),
        fechaActualizacion: Timestamp.now(),
      });

      router.push("/personas");
    } catch (err) {
      console.error("Error creando persona:", err);
      setError("Error al crear la persona. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Header title="Nueva Persona" subtitle="Agregar a la base de datos" />

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="tipoDocumento"
            name="tipoDocumento"
            label="Tipo de documento"
            value={form.tipoDocumento}
            onChange={handleChange}
            options={tipoDocumentoOptions}
          />
          <Input
            id="numeroDocumento"
            name="numeroDocumento"
            label="Número de documento"
            value={form.numeroDocumento}
            onChange={handleChange}
            placeholder="123456789"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            id="fechaNacimiento"
            name="fechaNacimiento"
            label="Fecha de nacimiento"
            value={form.fechaNacimiento}
            onChange={handleChange}
          />
          <Select
            id="sexo"
            name="sexo"
            label="Sexo"
            value={form.sexo}
            onChange={handleChange}
            options={sexoOptions}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="telefono"
            name="telefono"
            label="Teléfono"
            type="tel"
            value={form.telefono}
            onChange={handleChange}
            placeholder="300 123 4567"
          />
          <Input
            id="email"
            name="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
          />
        </div>

        <Input
          id="direccion"
          name="direccion"
          label="Dirección"
          value={form.direccion}
          onChange={handleChange}
          placeholder="Dirección de residencia"
        />

        <Textarea
          id="observaciones"
          name="observaciones"
          label="Observaciones"
          value={form.observaciones}
          onChange={handleChange}
          placeholder="Notas adicionales..."
          rows={3}
        />

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
            Guardar Persona
          </Button>
        </div>
      </form>
    </div>
  );
}