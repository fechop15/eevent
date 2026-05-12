"use client";

import { useState, useEffect, use } from "react";
import { doc, getDoc, collection, addDoc, getDocs, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Inscripcion, Pago } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

const tipoPagoOptions = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
];

export default function PagosInscripcionPage({ params }: { params: Promise<{ id: string; inscripcionId: string }> }) {
  const { inscripcionId } = use(params);
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tipoPago: "efectivo", monto: "", referencia: "", observaciones: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const inscDoc = await getDoc(doc(db, "inscripciones", inscripcionId));
        if (inscDoc.exists()) {
          setInscripcion({ id: inscDoc.id, ...inscDoc.data() } as Inscripcion);
        }
        const pagosSnap = await getDocs(collection(db, "inscripciones", inscripcionId, "pagos"));
        setPagos(pagosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Pago[]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [inscripcionId]);

  const handleSubmitPago = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const montoPago = parseFloat(form.monto);
      const pagoData = {
        tipoPago: form.tipoPago,
        monto: montoPago,
        fechaPago: Timestamp.now(),
        referencia: form.referencia,
        observaciones: form.observaciones,
      };

      await addDoc(collection(db, "inscripciones", inscripcionId, "pagos"), pagoData);

      const nuevoAbono = (inscripcion?.valorAbono || 0) + montoPago;
      const nuevoRestante = (inscripcion?.valorRestante || 0) - montoPago;
      const nuevoEstado = nuevoRestante <= 0 ? "pagado" : "abono";

      await updateDoc(doc(db, "inscripciones", inscripcionId), {
        valorAbono: nuevoAbono,
        valorRestante: Math.max(0, nuevoRestante),
        estadoPago: nuevoEstado,
        fechaActualizacion: Timestamp.now(),
      });

      setShowModal(false);
      setForm({ tipoPago: "efectivo", monto: "", referencia: "", observaciones: "" });

      const inscDoc = await getDoc(doc(db, "inscripciones", inscripcionId));
      if (inscDoc.exists()) {
        setInscripcion({ id: inscDoc.id, ...inscDoc.data() } as Inscripcion);
      }
      const pagosSnap = await getDocs(collection(db, "inscripciones", inscripcionId, "pagos"));
      setPagos(pagosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Pago[]);
    } catch (error) {
      console.error("Error registering pago:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: { toDate: () => Date } | null | undefined) => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!inscripcion) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Inscripción no encontrada</p>
      </div>
    );
  }

  const estadoColors: Record<string, "default" | "success" | "warning" | "danger"> = {
    pendiente: "danger",
    abono: "warning",
    pagado: "success",
    cancelado: "default",
  };

  return (
    <div>
      <Header
        title="Pagos"
        subtitle={`Inscripción: ${inscripcionId.slice(0, 8)}...`}
        action={{
          label: "+ Registrar Pago",
          onClick: () => setShowModal(true),
          variant: inscripcion.estadoPago === "pagado" ? "secondary" : "primary",
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-2">Valor Total</p>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(inscripcion.valorTotal)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-2">Abonado</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(inscripcion.valorAbono)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-2">Restante</p>
          <p className="text-2xl font-bold text-amber-400">{formatCurrency(inscripcion.valorRestante)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400 mb-2">Estado</p>
          <Badge variant={estadoColors[inscripcion.estadoPago] || "default"} className="text-lg">
            {inscripcion.estadoPago}
          </Badge>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Historial de Pagos</h2>
        {pagos.length === 0 ? (
          <p className="text-slate-500">No hay pagos registrados</p>
        ) : (
          <div className="space-y-3">
            {pagos.map((pago) => (
              <div key={pago.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-white/5">
                <div>
                  <p className="font-medium text-slate-200">{formatCurrency(pago.monto)}</p>
                  <p className="text-sm text-slate-400">
                    {formatDate(pago.fechaPago)} • {pago.tipoPago}
                    {pago.referencia && ` • ${pago.referencia}`}
                  </p>
                  {pago.observaciones && <p className="text-xs text-slate-500 mt-1">{pago.observaciones}</p>}
                </div>
                <Badge variant={pago.tipoPago === "efectivo" ? "info" : "purple"}>{pago.tipoPago}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Registrar Pago">
        <form onSubmit={handleSubmitPago} className="space-y-4">
          <Select
            id="tipoPago"
            label="Forma de pago"
            value={form.tipoPago}
            onChange={(e) => setForm((p) => ({ ...p, tipoPago: e.target.value }))}
            options={tipoPagoOptions}
          />
          <Input
            id="monto"
            label="Monto (COP)"
            type="number"
            value={form.monto}
            onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value }))}
            placeholder={`Máximo: ${formatCurrency(inscripcion.valorRestante)}`}
            required
          />
          <Input
            id="referencia"
            label="Referencia"
            value={form.referencia}
            onChange={(e) => setForm((p) => ({ ...p, referencia: e.target.value }))}
            placeholder="Ej: #transferencia 123456"
          />
          <Textarea
            id="observaciones"
            label="Observaciones"
            value={form.observaciones}
            onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))}
            placeholder="Notas..."
            rows={3}
          />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              Registrar Pago
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
