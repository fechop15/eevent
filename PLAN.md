# EEvent - Plan de Gestión de Eventos

## 1. Visión General

Plataforma web para gestionar eventos de todo tipo en Colombia. Permite crear eventos, administrar personas/contactos, gestionar pagos de inscripciones (con abonos), registrar gastos y generar reportes.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilos | Tailwind CSS + ui-ux-pro-max |
| Base de Datos | Firebase (Firestore) |
| Auth | Firebase Auth (cédula + password) |
| Almacenamiento | Firebase Storage (soportes de gastos) |
| Despliegue | Vercel (frontend) + Firebase Hosting (assets) |

---

## 3. Sistema de Auth (Cédula + Password)

### Flujo de Registro/Login
- **Login**: `cédula` (como identificador único) + `password`
- **Contraseña**: Mínimo 8 caracteres (Firebase validation)
- **Recuperación**: Por email (asociado a la cédula)

### Modelo de Usuario
```typescript
interface User {
  uid: string;              // Firebase Auth UID
  cedula: string;           // Identificador único (PK)
  nombre: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'organizador' | 'contador';
  estado: 'activo' | 'inactivo';
  fechaCreacion: Timestamp;
  ultimoAcceso: Timestamp;
}
```

### Roles y Permisos
| Permiso | Admin | Organizador | Contador |
|---|---|---|---|
| CRUD Eventos | ✅ | ✅ | ❌ |
| CRUD Personas | ✅ | ✅ | ✅ |
| Registrar Pagos | ✅ | ✅ | ❌ |
| Registrar Gastos | ✅ | ✅ | ❌ |
| Ver Reportes | ✅ | ✅ | ✅ |
| Gestionar Usuarios | ✅ | ❌ | ❌ |

---

## 4. Modelo de Datos (Firestore)

### 4.1 Colección: `eventos`
```typescript
interface Evento {
  id: string;               // Auto-generated
  nombre: string;
  descripcion: string;
  estatus: 'borrador' | 'activo' | 'finalizado' | 'cancelado';
  fechaInicio: Timestamp;
  fechaFin: Timestamp;
  lugar: string;
  observaciones: string;
  creadoPor: string;        // uid del usuario
  fechaCreacion: Timestamp;
  fechaActualizacion: Timestamp;
}
```

### 4.2 Colección: `personas`
```typescript
interface Persona {
  id: string;
  nombre: string;
  apellido: string;
  tipoDocumento: 'CC' | 'TI' | 'CE' | 'RC' | 'NIT' | 'PASAPORTE' | 'NIUP';
  numeroDocumento: string;
  fechaNacimiento: Timestamp;
  sexo: 'M' | 'F' | 'O';    // Masculino / Femenino / Otro
  telefono: string;
  email: string;
  direccion: string;
  observaciones: string;
  creadoPor: string;
  fechaCreacion: Timestamp;
  fechaActualizacion: Timestamp;
}
```

### 4.3 Colección: `tiposInscripcion`
```typescript
interface TipoInscripcion {
  id: string;
  nombre: string;           // ej: "General", "VIP", "Estudiante"
  precio: number;          // COP
  descripcion: string;
  eventoId: string;        // Relación con evento
  fechaCreacion: Timestamp;
}
```

### 4.4 Colección: `inscripciones`
```typescript
interface Inscripcion {
  id: string;
  eventoId: string;
  personaId: string;
  tipoInscripcionId: string;
  estadoPago: 'pendiente' | 'abono' | 'pagado' | 'cancelado';
  valorTotal: number;
  valorAbono: number;
  valorRestante: number;
  fechaCreacion: Timestamp;
  fechaActualizacion: Timestamp;
}
```

### 4.5 Subcolección: `pagos` (dentro de inscripciones)
```typescript
interface Pago {
  id: string;
  tipoPago: 'efectivo' | 'transferencia';
  monto: number;
  fechaPago: Timestamp;
  referencia: string;      // #transferencia o "efectivo"
  observaciones: string;
}
```

### 4.6 Colección: `gastos`
```typescript
interface Gasto {
  id: string;
  eventoId: string;
  descripcion: string;
  categoria: string;      // ej: "alimentación", "sonido", "fletes"
  monto: number;
  tipoPago: 'efectivo' | 'transferencia';
  fechaGasto: Timestamp;
  soporteUrl: string;     // URL Firebase Storage (opcional)
  soporteNombre: string;
  observaciones: string;
  creadoPor: string;
  fechaCreacion: Timestamp;
  fechaActualizacion: Timestamp;
}
```

---

## 5. Módulos de la Aplicación

```
/ (login)
├── /eventos
│   ├── /                   → Lista de eventos
│   ├── /nuevo              → Crear evento
│   └── /[id]/
│       ├── /               → Detalle / editar evento
│       ├── /dashboard       → Dashboard del evento
│       ├── /reportes        → Reportes del evento
│       ├── /inscripciones
│       ├── /gastos
│       └── /configuracion   → Tipos de inscripción del evento
├── /personas
│   ├── /                   → Lista de personas
│   ├── /nueva              → Crear persona
│   └── /[id]               → Detalle / editar persona
└── /configuracion          → Gestión de usuarios (solo admin)
```

---

## 6. Diseño UI (ui-ux-pro-max)

### Estilo Recomendado
- **UI Style**: `Soft UI Evolution` + `Data-Dense Dashboard`
- **Keywords**: Sombras suaves, profundidad sutil, profesional, enterprise feel
- **Performance**: Excelente | Accesibilidad: WCAG AA

### Paleta de Colores
```
Primary:     #4F46E5 (Indigo-600)
Primary Hover: #4338CA (Indigo-700)
Secondary:   #6366F1 (Indigo-500)
Success:     #10B981 (Emerald-500)
Warning:     #F59E0B (Amber-500)
Danger:      #EF4444 (Red-500)
Background:  #0F172A (Slate-900)
Card BG:     #1E293B (Slate-800)
Text Primary: #F8FAFC (Slate-50)
Text Secondary: #94A3B8 (Slate-400)
Border:      rgba(255,255,255,0.1)
```

### Tipografía
- **Font**: `Inter` (sans-serif)
- **Mood**: Profesional, limpio, moderno

### Efectos
- Sombras suaves (0 4px 6px -1px rgba)
- Transiciones suaves (200-300ms)
- Estados hover con `cursor-pointer`

### Componentes Reutilizables (BEN naming)
```
components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Badge.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   ├── Pagination.tsx
│   ├── Checkbox.tsx
│   ├── DatePicker.tsx
│   ├── FileUpload.tsx
│   └── EmptyState.tsx
├── layout/
│   ├── AdminLayout.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── PageHeader.tsx
└── forms/
    ├── FormField.tsx
    ├── FormActions.tsx
    └── FormError.tsx
```

---

## 7. Reportes (por evento)

Cada evento tiene su propio módulo de reportes. No existe un reporte general.

| Reporte | Descripción |
|---|---|
| Asistencia al evento | Personas inscritas, estado de pago |
| Resumen de ingresos | Total pagado, abonos, pendiente |
| Resumen de gastos | Total gastos, por categoría |
| Balance del evento | Ingresos - Gastos = Ganancia |
| Flujo de caja | Pagos y gastos por fecha |

---

## 8. Reglas de Seguridad (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      allow read: if request.auth != null;
      allow write: if getUserRole(request.auth.uid) == 'admin';
    }
    match /eventos/{eventId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if isAdmin() || isOrganizador();
    }
    match /personas/{personId} {
      allow read, write: if request.auth != null;
    }
    match /inscripciones/{inscId} {
      allow read: if request.auth != null;
      allow write: if isAdmin() || isOrganizador();
    }
    match /gastos/{gastoId} {
      allow read: if request.auth != null;
      allow write: if isAdmin() || isOrganizador();
    }
  }
}
```

---

## 9. Funcionalidades Clave por Módulo

### Eventos
- Crear/editar/cancelar eventos
- Filtros: por estatus, rango de fechas
- Búsqueda por nombre
- Ver resumen de inscripciones y gastos

### Personas
- Base de datos reusable
- Filtros: por tipo documento, sexo
- Búsqueda por nombre, cédula
- Historial de inscripciones por persona

### Inscripciones
- Asignar tipo de inscripción
- Registrar abonos parciales
- Registrar pagos (efectivo/transferencia)
- Historial de pagos por inscripción
- Estados: pendiente / abono / pagado / cancelado

### Gastos
- Registrar con categoría
- Subir soporte (imagen/PDF) opcional
- Filtros por categoría, rango de fechas

### Dashboard (por evento)
- KPIs: ingresos, gastos, balance, inscripciones
- Resumen de pagos y gastos
- Estado de inscripciones (pendiente/abono/pagado)
- Pagos recientes / Gastos recientes

### Reportes (por evento)
- Exportar a PDF / CSV
- Filtrar por rango de fechas
- Balance detallado (ingresos - gastos)

---

## 10. Estructura de Archivos

```
eevent/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── eventos/
│   │   │   │   ├── page.tsx              → Lista de eventos
│   │   │   │   ├── nuevo/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx          → Detalle evento
│   │   │   │       ├── dashboard/page.tsx
│   │   │   │       ├── reportes/page.tsx
│   │   │   │       ├── inscripciones/
│   │   │   │       ├── gastos/
│   │   │   │       └── configuracion/page.tsx
│   │   │   ├── personas/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── nueva/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── configuracion/page.tsx    → Gestión usuarios
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── forms/
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── auth.ts
│   │   └── firestore.ts
│   ├── types/
│   │   └── index.ts
│   └── hooks/
│       ├── useAuth.ts
│       ├── useEventos.ts
│       ├── usePersonas.ts
│       └── useInscripciones.ts
├── public/
├── .env.local
├── firebase.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 11. Consideraciones Adicionales

- **Moneda**: COP (pesos colombianos) con formato `$1.234.567`
- **Fechas**: Formato `DD/MM/YYYY` (locale Colombia)
- **Validación**: Cédula válida (algoritmo módulo 11 para CC colombiana)
- **Soft delete**: Marcar `estado: 'cancelado'` en lugar de eliminar registros
- **Responsive**: Mobile-first
- **Notificaciones**: Toast alerts para feedback de acciones

---

## 12. Flujo de Implementación (Sugerido)

### Fase 1: Foundation
1. Inicializar proyecto Next.js
2. Configurar Firebase (Auth + Firestore)
3. Crear layout base (Sidebar + Header)
4. Implementar auth con cédula/password
5. Crear componentes UI base

### Fase 2: Core Modules
6. Módulo Eventos (CRUD)
7. Módulo Personas (CRUD + búsqueda)
8. Módulo Inscripciones + Pagos
9. Módulo Gastos + upload soportes

### Fase 3: Reports & Polish
10. Dashboard por evento con KPIs
11. Reportes por evento (PDF/CSV)
12. Roles y permisos completos
13. Responsive mobile
14. Despliegue
