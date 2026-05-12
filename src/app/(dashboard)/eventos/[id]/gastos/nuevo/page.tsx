"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

const categoriasGasto = [
  { value: "alimentacion", label: "Alimentación" },
  { value: "sonido", label: "Sonido" },
  { value: "iluminacion", label: "Iluminación" },
  { value: "fletes", label: "Fletes / Transporte" },
  { value: "logistica", label: "Logística" },
  { value: "personal", label: "Personal" },
  { value: "decoracion", label: "Decoración" },
  { value: "permisos", label: "Permisos y licencias" },
  { value: "seguridad", label: "Seguridad" },
  { value: "otro", label: "Otro" },
];

const tipoPagoOptions = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
];

export default function NuevoGastoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventoId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    descripcion: "",
    categoria: "otro",
    monto: "",
    tipoPago: "efectivo",
    referencia: "",
    observaciones: "",
    soporteUrl: "",
    soporteNombre: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.descripcion || !form.monto) {
      setError("Descripción y monto son requeridos");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "gastos"), {
        eventoId,
        descripcion: form.descripcion,
        categoria: form.categoria,
        monto: parseFloat(form.monto),
        tipoPago: form.tipoPago,
        fechaGasto: Timestamp.now(),
        referencia: form.referencia,
        observaciones: form.observaciones,
        soporteUrl: form.soporteUrl,
        soporteNombre: form.soporteNombre,
        creadoPor: user?.uid,
        fechaCreacion: Timestamp.now(),
        fechaActualizacion: Timestamp.now(),
      });

      router.push(`/eventos/${eventoId}`);
    } catch (err) {
      console.error("Error creando gasto:", err);
      setError("Error al registrar el gasto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Header title="Registrar Gasto" subtitle="Agregar un nuevo gasto al evento" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          id="descripcion"
          name="descripcion"
          label="Descripción"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Ej: Servicio de catering"
          required
        />

        <Select
          id="categoria"
          name="categoria"
          label="Categoría"
          value={form.categoria}
          onChange={handleChange}
          options={categoriasGasto}
        />

        <Input
          id="monto"
          name="monto"
          label="Monto (COP)"
          type="number"
          value={form.monto}
          onChange={handleChange}
          placeholder="100000"
          required
        />

        <Select
          id="tipoPago"
          name="tipoPago"
          label="Forma de pago"
          value={form.tipoPago}
          onChange={handleChange}
          options={tipoPagoOptions}
        />

        <Input
          id="referencia"
          name="referencia"
          label="Referencia"
          value={form.referencia}
          onChange={handleChange}
          placeholder="Ej: #transferencia 123456"
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
            Registrar Gasto
          </Button>
        </div>
      </form>
    </div>
  );
}
