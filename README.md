# 🌐 Turnos_ya - Frontend Web Application

Aplicación web cliente (Single Page Application - SPA) de la plataforma **Turnos_ya**. Desarrollada con **React 19**, **Vite 8** y **TypeScript**, ofrece una interfaz moderna, fluida e intuitiva tanto para clientes que buscan reservar turnos como para prestadores de servicios que gestionan sus comercios y agendas, además de un panel global de administración del sistema.

---

## 🛠️ Stack Tecnológico

- **Biblioteca de UI**: [React 19](https://react.dev/) (v19.2)
- **Empaquetador y Bundler**: [Vite 8](https://vitejs.dev/) con ESM ultrarrápido
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (v6.0)
- **Enrutamiento**: [React Router DOM](https://reactrouter.com/) (v7.18)
- **Cliente HTTP**: [Axios](https://axios-http.com/) (v1.19) con interceptor automático para inyección de JWT Bearer
- **Autenticación Federada**: [Google Identity Services](https://developers.google.com/identity/gsi/web) (Google OAuth 2.0)
- **Iconografía**: [Lucide React](https://lucide.dev/) (v1.31)
- **Manejo de Fechas**: [date-fns](https://date-fns.org/) (v4.4)
- **Pruebas Automatizadas**: [Vitest](https://vitest.dev/) (v5.0)
- **Linter**: [Oxlint](https://oxc.rs/docs/guide/usage/linter)
- **Sistema de Estilos**: Custom Design System basado en **CSS Vanilla nativo** (`variables.css` y `global.css`) sin dependencias pesadas de frameworks externos

---

## 📁 Estructura del Proyecto

```text
Turnos_ya_frontend_web-main/
├── public/                     # Recursos estáticos y favicon
├── src/
│   ├── components/             # Componentes estructurales y modulares
│   │   ├── common/             # Componentes reutilizables de UI
│   │   ├── GoogleSignInButton.tsx # Botón oficial y flujo One-Tap de Google OAuth 2.0
│   │   ├── Layout.tsx          # Shell base: Header con banner de verificación, Nav y Footer
│   │   └── NotificationBell.tsx # Campanita con contador no leído y menú desplegable
│   ├── context/
│   │   └── AuthContext.tsx     # Estado global de autenticación, usuario, rol y persistencia JWT
│   ├── pages/                  # Vistas principales de la aplicación
│   │   ├── Booking.tsx         # Asistente interactivo de reserva (Servicio -> Fecha/Hora -> Hold -> Confirmar)
│   │   ├── BusinessDetail.tsx  # Ficha del comercio con mapa, servicios, horarios y valoraciones
│   │   ├── Dashboard.tsx       # Panel del dueño (agenda diaria/semanal, catálogo de servicios y horarios)
│   │   ├── Home.tsx            # Portada: búsqueda, categorías, geolocalización y listado de negocios
│   │   ├── Login.tsx           # Inicio de sesión con credenciales y acceso directo vía Google
│   │   ├── MyAppointments.tsx  # Historial de turnos del cliente (próximos, pasados y cancelación)
│   │   ├── Profile.tsx         # Perfil, verificación de email (código 6 dígitos), 2FA clave y alertas
│   │   ├── RecoverPassword.tsx # Solicitud de enlace para restablecimiento de contraseña olvidada
│   │   ├── Register.tsx        # Alta de usuarios con selección de rol (Cliente o Dueño de Negocio)
│   │   ├── ResetPassword.tsx   # Establecimiento de nueva contraseña con token de un solo uso
│   │   ├── SystemAdmin.tsx     # Panel global de administración, gestión de roles y estadísticas
│   │   └── VerifyEmail.tsx     # Validación de email en 1 clic desde enlace del correo
│   ├── services/
│   │   ├── api.ts              # Configuración de Axios, interceptores JWT y normalización de errores
│   │   └── api.test.ts         # Pruebas unitarias de la capa de red con Vitest
│   ├── styles/
│   │   ├── global.css          # Clases utilitarias, resets, layout grid/flex y componentes
│   │   └── variables.css       # Tokens de diseño (colores Mercado Libre, tipografía, radios, sombras)
│   ├── types/                  # Modelos e interfaces TypeScript compartidas
│   ├── utils/                  # Lógica auxiliar testeada
│   │   ├── businessFilterHelper.ts & .test.ts # Filtros dinámicos por nombre, rubro y dirección
│   │   ├── locationHelper.ts & .test.ts       # Cálculo de distancias en km (Haversine) y geoposición
│   │   └── timeHelper.ts & .test.ts           # Formateo de fechas y generación de slots horarios
│   ├── App.tsx                 # Definición del árbol de rutas protegidas y públicas
│   ├── App.css
│   ├── index.css               # Import de tipografía 'Plus Jakarta Sans'
│   └── main.tsx                # Entrada de la aplicación y montaje en el DOM
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## ✨ Funcionalidades Principales

### 1. Búsqueda y Geolocalización de Comercios (`Home.tsx`)
- Filtrado interactivo por categorías (Barbería, Estética, Salud, Deportes, etc.).
- Búsqueda en tiempo real por nombre de negocio, rubro o dirección.
- Detección de ubicación geográfica del usuario con cálculo dinámico de distancia en kilómetros a cada comercio.

### 2. Flujo de Reserva en 3 Pasos y Bloqueo Temporal (`Booking.tsx`)
- Selección guiada de servicio, duración y profesional.
- Selector de fecha con visualización en tiempo real de slots horarios disponibles.
- **Hold Token**: Bloqueo temporal transaccional de 10 minutos con cuenta regresiva visible para prevenir colisiones de reserva mientras se completan los datos.

### 3. Autenticación Híbrida y Seguridad de Usuarios
- Inicio de sesión y registro clásico con email y contraseña hasheada con bcrypt.
- **Inicio de Sesión con Google**: Integración con Google Identity Services (One-Tap y botón renderizado automáticamente).
- **Recuperación de Contraseña**: Flujo completo de solicitud y reseteo seguro mediante token temporal (`RecoverPassword.tsx` y `ResetPassword.tsx`).
- **Verificación Progresiva de Email**: Banner no intrusivo en el Header, validación en 1 clic (`/verify-email?token=...`) y panel interactivo con código de 6 dígitos en `Profile.tsx`.
- **Cambio de Contraseña Seguro (2FA por Correo)**: Requiere confirmación mediante código de 6 dígitos enviado al email del usuario antes de actualizar la clave.

### 4. Centro de Notificaciones en Tiempo Real (`NotificationBell.tsx`)
- Icono de campanita en el Header con insignia numérica de notificaciones no leídas.
- Menú desplegable interactivo con scroll, visualización de alertas de turnos y botón para marcar todas como leídas.

### 5. Panel de Control del Prestador (`Dashboard.tsx`)
- Vista de agenda de turnos con pestañas por estado (`CONFIRMED`, `COMPLETED`, `CANCELLED`, etc.).
- Gestión integral del catálogo de servicios (alta, edición de precios, duración y tiempo de colchón).
- Configuración de la matriz horaria semanal de atención.

### 6. Gestión del Cliente (`MyAppointments.tsx` & `Profile.tsx`)
- Historial completo de reservas clasificadas en próximas y pasadas.
- Cancelación ágil de citas con motivo registrado y validación de políticas.
- Configuración de preferencias de notificación (Email y WhatsApp).

### 7. Panel de Administración del Sistema (`SystemAdmin.tsx`)
- Tablero exclusivo para usuarios con rol `administrator`.
- Métricas globales de usuarios, turnos, comercios y reservas.
- Tabla de usuarios con opción de cambio dinámico de rol o eliminación.

---

## ⚙️ Variables de Entorno

Crear un archivo `.env` en la raíz de `Turnos_ya_frontend_web-main`:

```env
# URL de la API Backend
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Client ID de Google para autenticación OAuth 2.0
VITE_GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
```

---

## 🚀 Comandos de Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo con Vite
npm run dev
# La aplicación estará disponible en http://localhost:5173

# 3. Ejecutar pruebas automatizadas con Vitest
npm run test

# 4. Validar código con Oxlint
npm run lint

# 5. Compilar bundle de producción
npm run build

# 6. Previsualizar la compilación localmente
npm run preview
```

---

## 🧪 Pruebas Unitarias

La aplicación utiliza **Vitest** para garantizar la fiabilidad de sus componentes y funciones críticas:
- `locationHelper.test.ts`: Pruebas de cálculo de distancia euclidiana y fórmula de Haversine en kilómetros.
- `businessFilterHelper.test.ts`: Pruebas de coincidencia de términos de búsqueda y categorías.
- `timeHelper.test.ts`: Pruebas de validación de horas de reloj y franjas horarias.
- `api.test.ts`: Pruebas de inyección de encabezados `Authorization: Bearer <token>` y manejo de códigos HTTP de error.
