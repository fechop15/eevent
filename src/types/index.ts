export class Timestamp {
  static now() {
    const d = new Date();
    const seconds = Math.floor(d.getTime() / 1000);
    return { seconds, nanoseconds: 0 };
  }
  toDate() {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1000000);
  }
  seconds: number = 0;
  nanoseconds: number = 0;
}

export function formatTimestamp(timestamp: { toDate?: () => Date; seconds?: number; nanoseconds?: number } | null | undefined): string {
  if (!timestamp) return "";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  if (typeof timestamp.seconds === "number") {
    return new Date(timestamp.seconds * 1000).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  return "";
}

export function capitalizeName(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export type Rol = 'admin' | 'organizador' | 'contador';
export type EstadoUsuario = 'activo' | 'inactivo';
export type EstatusEvento = 'borrador' | 'activo' | 'finalizado' | 'cancelado';
export type TipoDocumento = 'CC' | 'TI' | 'CE' | 'RC' | 'NIT' | 'PASAPORTE' | 'NIUP';
export type Sexo = 'M' | 'F' | 'O';
export type EstadoPago = 'pendiente' | 'abono' | 'pagado' | 'cancelado';
export type TipoPago = 'efectivo' | 'transferencia';

export interface User {
  uid: string;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  estado: EstadoUsuario;
  fechaCreacion: Timestamp;
  ultimoAcceso: Timestamp;
}

export interface Evento {
  id: string;
  nombre: string;
  descripcion: string;
  estatus: EstatusEvento;
  fechaInicio: Timestamp;
  fechaFin: Timestamp;
  lugar: string;
  observaciones: string;
  creadoPor: string;
  fechaCreacion: Timestamp;
  fechaActualizacion: Timestamp;
}

export interface Persona {
  id: string;
  nombre: string;
  apellido: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  fechaNacimiento: Timestamp;
  sexo: Sexo;
  telefono: string;
  email: string;
  direccion: string;
  observaciones: string;
  creadoPor: string;
  fechaCreacion: Timestamp;
  fechaActualizacion: Timestamp;
}

export interface TipoInscripcion {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  eventoId: string;
  fechaCreacion: Date | Record<string, unknown>;
}

export interface Inscripcion {
  id: string;
  eventoId: string;
  personaId: string;
  tipoInscripcionId: string;
  espacioId: string | null;
  estadoPago: EstadoPago;
  valorTotal: number;
  valorAbono: number;
  valorRestante: number;
  fechaCreacion: Timestamp;
  fechaActualizacion: Timestamp;
}

export interface Pago {
  id: string;
  tipoPago: TipoPago;
  monto: number;
  fechaPago: Timestamp;
  referencia: string;
  observaciones: string;
}

export interface Tarea {
  id: string;
  eventoId: string;
  titulo: string;
  descripcion: string;
  completada: boolean;
  fechaLimite: Timestamp | null;
  fechaCreacion: Timestamp;
  fechaActualizacion: Timestamp;
}

export interface Espacio {
  id: string;
  eventoId: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  responsableId: string | null;
  fechaCreacion: Timestamp;
  fechaActualizacion: Timestamp;
}

export interface Gasto {
  id: string;
  eventoId: string;
  descripcion: string;
  categoria: string;
  monto: number;
  tipoPago: TipoPago;
  fechaGasto: Timestamp;
  soporteUrl: string;
  soporteNombre: string;
  soporteData: string;
  soporteMimeType: string;
  observaciones: string;
  referencia: string;
  creadoPor: string;
  fechaCreacion: Timestamp;
  fechaActualizacion: Timestamp;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (cedula: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: Omit<User, 'uid' | 'fechaCreacion' | 'ultimoAcceso'> & { password: string }) => Promise<void>;
}