# StayAS Backend API

**Backend oficial de StayAS** - Plataforma bidireccional de reservas turísticas que conecta viajeros con hospedajes y experiencias locales.

## 📋 Índice

- [Descripción](#-descripción)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Base de Datos](#-base-de-datos)
- [API Endpoints](#-api-endpoints)
- [Autenticación](#-autenticación)
- [Manejo de Archivos](#-manejo-de-archivos)
- [Sistema de Roles](#-sistema-de-roles)
- [Desarrollo](#-desarrollo)

---

## 📖 Descripción

StayAS Backend es una API RESTful completa que potencia una plataforma de reservas turísticas bidireccional. El sistema permite a los usuarios reservar tanto alojamientos como actividades turísticas, mientras que los hosts pueden publicar y gestionar sus propiedades y experiencias. Incluye un panel administrativo robusto para la supervisión de la plataforma, gestión de usuarios, procesamiento de pagos y generación de reportes.

### Características Principales

- **Sistema de autenticación completo** con JWT, verificación de email y recuperación de contraseña
- **Gestión de usuarios multi-rol** (CLIENT, HOST, EMPLOYEE, ADMIN)
- **Sistema de reservas bidireccional** para propiedades y actividades
- **Procesamiento de pagos** con generación automática de recibos en PDF
- **Gestión de disponibilidad** con prevención de sobreventa
- **Sistema de solicitudes para hosts** con workflow de aprobación
- **Calendario público** de eventos turísticos
- **Panel administrativo** con dashboard y analytics
- **Sistema de categorización** compartido entre propiedades, actividades y eventos
- **Gestión multimedia** para propiedades y actividades
- **Sistema de logging** completo para auditoría
- **Manejo de archivos estáticos** para imágenes y documentos

---

## 🛠 Tecnologías

### Core
- **Node.js** v18+ - Runtime de JavaScript
- **Express.js** v4 - Framework web
- **PostgreSQL** - Base de datos relacional
- **Prisma ORM** - Object-Relational Mapping

### Autenticación y Seguridad
- **JWT (jsonwebtoken)** - Autenticación basada en tokens
- **bcryptjs** - Hash de contraseñas
- **CORS** - Control de acceso entre dominios

### Utilidades
- **Nodemailer** - Envío de correos electrónicos
- **Multer** - Manejo de uploads de archivos
- **PDFKit** - Generación de PDFs para recibos
- **dotenv** - Gestión de variables de entorno

---

## ⚙️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** v18 o superior
- **PostgreSQL** v13 o superior
- **npm** o **yarn**
- **Git**

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/stay-as-backend.git
cd stay-as-backend
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en el ejemplo:

```bash
cp .env.example .env
```

### 4. Configurar la Base de Datos

```bash
# Ejecutar migraciones
npx prisma migrate dev

# Generar el cliente de Prisma
npx prisma generate

# (Opcional) Poblar la base de datos con datos de prueba
npx prisma db seed
```

### 5. Iniciar el Servidor

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:4000`

---

## 🔧 Configuración

### Variables de Entorno

Configura las siguientes variables en tu archivo `.env`:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/stayasdb"

# Configuración del servidor
PORT=4000
FRONTEND_URL=http://localhost:3000

# Autenticación JWT
JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui

# Configuración de email (Gmail)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion

# Rutas de archivos
UPLOAD_BASE_PATH=uploads
```

### Configuración de Email (Gmail)

Para usar Gmail como servicio de correo:

1. Habilita la verificación en 2 pasos en tu cuenta de Google
2. Genera una "Contraseña de aplicación" en la configuración de seguridad
3. Usa esa contraseña en `EMAIL_PASSWORD`

---

## 📁 Estructura del Proyecto

```
stay-as-backend/
│
├── config/
│   └── db.js                    # Configuración de Prisma
│
├── controllers/                 # Controladores de rutas
│   ├── activities_controller.js
│   ├── auth_controller.js
│   ├── calendarEvents_controller.js
│   ├── categories_controller.js
│   ├── hostRequest_controller.js
│   ├── logs_controller.js
│   ├── payments_controller.js
│   ├── properties_controller.js
│   ├── reservations_controller.js
│   ├── users_controller.js
│   └── verification_controller.js
│
├── middleware/                  # Middlewares personalizados
│   ├── auth_middleware.js       # Autenticación JWT
│   ├── activityUpload_middleware.js
│   ├── propertyUpload_middleware.js
│   └── upload_middleware.js
│
├── models/                      # Modelos de datos
│   ├── activity_model.js
│   ├── calendarEvent_model.js
│   ├── category_model.js
│   ├── log_model.js
│   ├── payment_model.js
│   ├── property_model.js
│   ├── user_model.js
│   └── ...
│
├── routes/                      # Definición de rutas
│   ├── activities.routes.js
│   ├── auth.routes.js
│   ├── calendarEvents.routes.js
│   ├── categories.routes.js
│   ├── hostRequest.routes.js
│   ├── logs.routes.js
│   ├── payments.routes.js
│   ├── properties.routes.js
│   ├── reservations.routes.js
│   ├── users.routes.js
│   └── verification.routes.js
│
├── services/                    # Lógica de negocio
│   ├── activity_service.js
│   ├── adminDashboard_service.js
│   ├── auth_service.js
│   ├── calendarEvent_service.js
│   ├── category_service.js
│   ├── hostRequest_service.js
│   ├── log_service.js
│   ├── payment_service.js
│   ├── property_service.js
│   ├── reservation_service.js
│   ├── user_service.js
│   └── verification_service.js
│
├── utils/
│   ├── email.js                 # Utilidades de email
│   └── pdfGenerator.js          # Generación de PDFs
│
├── uploads/                     # Archivos subidos (imágenes, docs)
│
├── prisma/
│   └── schema.prisma           # Esquema de base de datos
│
├── app.js                      # Configuración de Express
├── server.js                   # Punto de entrada del servidor
├── roles.js                    # Definición de roles y permisos
├── package.json
└── .env
```

---

## 🗄️ Base de Datos

### Modelos Principales

#### User
Almacena información de usuarios del sistema con diferentes roles.
- **Campos**: id, name, email, password (hash), role, profileImage, isVerified
- **Roles**: CLIENT, HOST, EMPLOYEE, ADMIN

#### Property
Propiedades de hospedaje publicadas por hosts.
- **Campos**: title, description, type, price, capacity, bedrooms, bathrooms, ubicación, status
- **Relaciones**: Usuario propietario, media, amenidades, reservaciones, reseñas

#### Activity
Experiencias y actividades turísticas.
- **Campos**: title, description, price, capacity, duration, ubicación, fechas de evento
- **Relaciones**: Usuario creador, media, reservaciones, reseñas, categorías

#### ReservationProperty / ReservationActivity
Sistema de reservas para propiedades y actividades.
- **Estados**: pending, confirmed, cancelled, completed
- **Campos**: Fechas, número de personas/huéspedes, precio total, estado

#### HostRequest
Solicitudes de usuarios para convertirse en hosts.
- **Estados**: PENDING, IN_REVIEW, APPROVED, REJECTED
- **Workflow**: Solicitud inicial → Formulario completo → Revisión → Aprobación/Rechazo

#### CalendarEvent
Eventos públicos del calendario turístico.
- **Campos**: title, description, eventDate, endDate, location, isPublic

#### PaymentProperty / PaymentActivity
Registros de pagos procesados.
- **Campos**: amount, paymentDate, method, status, folio (número de recibo)

#### ActivityCategory
Sistema de categorización compartido.
- **Tipos**: ACTIVITY, PROPERTY, EVENT
- **Uso**: Organización y filtrado de contenido

### Diagrama de Relaciones Clave

```
User ──┬──> Property ──> ReservationProperty ──> PaymentProperty
       ├──> Activity ──> ReservationActivity ──> PaymentActivity
       ├──> HostRequest
       ├──> CalendarEvent
       └──> SystemLog

ActivityCategory ──┬──> PropertyCategoryRelation ──> Property
                   ├──> ActivityCategoryRelation ──> Activity
                   └──> CalendarEventCategoryRelation ──> CalendarEvent
```

### Comandos Prisma Útiles

```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Abrir Prisma Studio (GUI)
npx prisma studio

# Resetear base de datos (desarrollo)
npx prisma migrate reset

# Generar cliente actualizado
npx prisma generate
```

---

## 🔌 API Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/register` | Registrar nuevo usuario | No |
| POST | `/login` | Iniciar sesión | No |
| POST | `/verify-email` | Verificar email con código | Sí |
| POST | `/resend-verification` | Reenviar código de verificación | Sí |
| POST | `/forgot-password` | Solicitar recuperación de contraseña | No |
| POST | `/reset-password` | Restablecer contraseña | No |
| GET | `/profile` | Obtener perfil del usuario | Sí |

### Usuarios (`/api/users`)

| Método | Endpoint | Descripción | Roles Permitidos |
|--------|----------|-------------|------------------|
| GET | `/` | Listar usuarios | ADMIN, EMPLOYEE |
| GET | `/:id` | Obtener usuario por ID | ADMIN, EMPLOYEE |
| PUT | `/:id` | Actualizar usuario | ADMIN, EMPLOYEE, HOST, CLIENT (propio) |
| DELETE | `/:id` | Eliminar usuario | ADMIN |
| PATCH | `/:id/toggle-status` | Activar/desactivar usuario | ADMIN |

### Propiedades (`/api/accommodations`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar propiedades | No |
| GET | `/:id` | Obtener propiedad por ID | No |
| POST | `/` | Crear propiedad | Sí (HOST) |
| PUT | `/:id` | Actualizar propiedad | Sí (HOST/ADMIN) |
| DELETE | `/:id` | Eliminar propiedad | Sí (HOST/ADMIN) |
| PATCH | `/:id/toggle-status` | Cambiar disponibilidad | Sí (HOST/ADMIN) |

### Actividades (`/api/experiences`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar actividades | No |
| GET | `/:id` | Obtener actividad por ID | No |
| POST | `/` | Crear actividad | Sí (HOST) |
| PUT | `/:id` | Actualizar actividad | Sí (HOST/ADMIN) |
| DELETE | `/:id` | Eliminar actividad | Sí (HOST/ADMIN) |
| PATCH | `/:id/toggle-status` | Cambiar disponibilidad | Sí (HOST/ADMIN) |

### Reservaciones (`/api/reservations`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/properties` | Mis reservaciones de propiedades | Sí |
| GET | `/activities` | Mis reservaciones de actividades | Sí |
| POST | `/properties` | Crear reservación de propiedad | Sí |
| POST | `/activities` | Crear reservación de actividad | Sí |
| PATCH | `/:type/:id/status` | Actualizar estado de reservación | Sí (HOST/ADMIN) |

### Pagos (`/api/payments`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar pagos | Sí (ADMIN) |
| GET | `/:type/:id` | Obtener detalles de pago | Sí |
| POST | `/properties/:id` | Procesar pago de propiedad | Sí |
| POST | `/activities/:id` | Procesar pago de actividad | Sí |
| GET | `/:type/:id/receipt` | Descargar recibo PDF | Sí |

### Solicitudes de Host (`/api/host-requests`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar solicitudes | Sí (ADMIN/EMPLOYEE) |
| GET | `/:id` | Obtener solicitud por ID | Sí |
| POST | `/initial` | Crear solicitud inicial | Sí (CLIENT) |
| PUT | `/:id` | Completar formulario | Sí (CLIENT) |
| PATCH | `/:id/approve` | Aprobar solicitud | Sí (ADMIN/EMPLOYEE) |
| PATCH | `/:id/reject` | Rechazar solicitud | Sí (ADMIN/EMPLOYEE) |

### Calendario (`/api/calendar`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/public` | Eventos públicos del calendario | No |
| GET | `/public/:year/:month` | Eventos de un mes específico | No |

### Eventos del Calendario (`/api/calendar-events`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar todos los eventos | Sí (ADMIN/EMPLOYEE) |
| GET | `/:id` | Obtener evento por ID | Sí |
| POST | `/` | Crear evento | Sí (ADMIN/EMPLOYEE) |
| PUT | `/:id` | Actualizar evento | Sí (ADMIN/EMPLOYEE) |
| DELETE | `/:id` | Eliminar evento | Sí (ADMIN) |

### Categorías (`/api/categories`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar categorías | No |
| GET | `/:id` | Obtener categoría por ID | No |
| POST | `/` | Crear categoría | Sí (ADMIN) |
| PUT | `/:id` | Actualizar categoría | Sí (ADMIN) |
| DELETE | `/:id` | Eliminar categoría | Sí (ADMIN) |

### Dashboard Administrativo (`/api/admin/dashboard`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/stats` | Estadísticas generales | Sí (ADMIN/EMPLOYEE) |

### Logs del Sistema (`/api/logs`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar logs del sistema | Sí (ADMIN/EMPLOYEE) |

### Códigos de Verificación (`/api/verification-codes`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Ver códigos activos | Sí (ADMIN) |
| POST | `/:userId/resend` | Reenviar código | Sí (ADMIN) |

---

## 🔐 Autenticación

### Sistema JWT

La API utiliza JSON Web Tokens (JWT) para autenticación. Los tokens se generan al iniciar sesión y deben incluirse en el header de las peticiones protegidas.

#### Flujo de Autenticación

1. **Registro**: El usuario se registra con email y contraseña
2. **Verificación**: Se envía un código de 6 dígitos al email
3. **Activación**: El usuario verifica su email con el código
4. **Login**: El usuario inicia sesión y recibe un JWT
5. **Acceso**: El JWT se incluye en peticiones posteriores

#### Formato del Token

```
Authorization: Bearer <tu_token_jwt>
```

#### Ejemplo de Petición Autenticada

```javascript
const response = await fetch('http://localhost:4000/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Recuperación de Contraseña

1. Usuario solicita recuperación con su email (`POST /api/auth/forgot-password`)
2. Se envía un email con token único
3. Usuario usa el token para establecer nueva contraseña (`POST /api/auth/reset-password`)
4. El token expira después de 1 hora

---

## 📤 Manejo de Archivos

### Upload de Imágenes

El sistema utiliza **Multer** para manejar uploads de archivos. Los archivos se almacenan localmente en el directorio `uploads/`.

#### Estructura de Uploads

```
uploads/
├── activities/           # Imágenes de actividades
├── properties/           # Imágenes de propiedades
├── users/               # Fotos de perfil
└── documents/           # Documentos (host requests)
```

#### Formatos Permitidos

- **Imágenes**: .jpg, .jpeg, .png, .gif, .webp
- **Documentos**: .pdf, .doc, .docx

#### Límites

- **Tamaño máximo por archivo**: 10MB
- **Máximo de archivos por upload**: 10 (propiedades y actividades)

#### Ejemplo de Upload (Frontend)

```javascript
const formData = new FormData();
formData.append('title', 'Mi Actividad');
formData.append('description', 'Descripción...');
formData.append('images', file1);
formData.append('images', file2);

const response = await fetch('http://localhost:4000/api/experiences', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Servicio de Archivos Estáticos

Los archivos subidos son accesibles públicamente:

```
http://localhost:4000/uploads/activities/imagen.jpg
http://localhost:4000/uploads/properties/propiedad.jpg
http://localhost:4000/uploads/users/perfil.jpg
```

---

## 👥 Sistema de Roles

### Roles Disponibles

#### CLIENT
Usuario estándar de la plataforma.
- **Permisos**:
  - Ver y buscar propiedades y actividades
  - Crear reservaciones
  - Procesar pagos
  - Gestionar su perfil
  - Solicitar convertirse en host

#### HOST
Usuario que puede publicar propiedades y actividades.
- **Permisos**:
  - Todos los permisos de CLIENT
  - Crear y gestionar propiedades
  - Crear y gestionar actividades
  - Ver y gestionar reservaciones de sus propiedades/actividades
  - Actualizar disponibilidad

#### EMPLOYEE
Personal de la plataforma.
- **Permisos**:
  - Ver todos los usuarios
  - Revisar solicitudes de host
  - Aprobar/rechazar solicitudes de host
  - Ver logs del sistema
  - Acceder al dashboard administrativo (limitado)

#### ADMIN
Administrador con control total.
- **Permisos**:
  - Todos los permisos anteriores
  - Crear, editar y eliminar cualquier contenido
  - Gestionar usuarios (activar/desactivar, eliminar)
  - Gestionar categorías
  - Acceso completo al dashboard administrativo
  - Ver y gestionar todos los pagos
  - Ver todos los logs del sistema

### Middleware de Autorización

El sistema verifica roles en cada petición protegida:

```javascript
// Ejemplo en un controlador
router.post('/', 
  authMiddleware,  // Verifica que esté autenticado
  checkRole(['HOST', 'ADMIN']),  // Verifica rol específico
  createProperty
);
```

---

## 💻 Desarrollo

### Scripts Disponibles

```bash
# Iniciar servidor en modo desarrollo (con nodemon)
npm run dev

# Iniciar servidor en modo producción
npm start

# Ejecutar linter
npm run lint

# Ejecutar tests
npm test

# Generar cliente de Prisma
npm run prisma:generate

# Crear migración de base de datos
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio
```

### Flujo de Desarrollo

1. **Crear rama de feature**:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

2. **Hacer cambios y commit**:
   ```bash
   git add .
   git commit -m "feat: descripción de la funcionalidad"
   ```

3. **Actualizar esquema de Prisma** (si es necesario):
   ```bash
   npx prisma migrate dev --name nombre_migracion
   ```

4. **Push y crear Pull Request**:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```

### Convenciones de Código

- **Nombres de archivos**: snake_case para archivos JavaScript (`auth_controller.js`)
- **Nombres de funciones**: camelCase (`getUserById`)
- **Nombres de clases**: PascalCase (`ActivityModel`)
- **Constantes**: UPPER_SNAKE_CASE (`JWT_SECRET`)
- **Rutas**: kebab-case (`/api/host-requests`)

### Logging

El sistema incluye un sistema de logging completo que registra:
- Acciones de usuarios (login, registro, etc.)
- Cambios en entidades (crear, actualizar, eliminar)
- Errores y excepciones
- Información de la petición (IP, User-Agent)

Los logs se almacenan en la base de datos (tabla `SystemLog`) y pueden consultarse desde el panel administrativo.

### Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests en modo watch
npm run test:watch
```

---

## 📝 Notas Adicionales

### Seguridad

- Las contraseñas se hashean con bcrypt (10 rounds)
- Los tokens JWT expiran después de 7 días
- Los códigos de verificación expiran después de 15 minutos
- Los tokens de recuperación de contraseña expiran después de 1 hora
- Validación de inputs en todos los endpoints
- Rate limiting en endpoints sensibles

### Performance

- Índices en campos frecuentemente consultados
- Paginación en listados grandes
- Eager loading de relaciones cuando es necesario
- Compresión de respuestas
- Caching de consultas frecuentes (a implementar)

### Mejoras Futuras

- [ ] Sistema de notificaciones en tiempo real (WebSockets)
- [ ] Integración con pasarelas de pago (Stripe, PayPal)
- [ ] Sistema de valoraciones y reseñas más robusto
- [ ] Chat entre usuarios y hosts
- [ ] Recomendaciones personalizadas con ML
- [ ] API para aplicaciones móviles
- [ ] Sistema de cupones y descuentos
- [ ] Multiidioma
- [ ] Analytics avanzado

---

## 📄 Licencia

Este proyecto es privado y confidencial. Todos los derechos reservados © 2025 StayAS | SmartLink.

---

Desarrollado por el equipo de SmartLink
