class Timestamp {
  static now() { return { toDate: () => new Date() }; }
  toDate() { return new Date(); }
  seconds: number = 0;
  nanoseconds: number = 0;
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
  fechaCreacion: Timestamp;
}

export interface Inscripcion {
  id: string;
  eventoId: string;
  personaId: string;
  tipoInscripcionId: string;
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
  observaciones: string;
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