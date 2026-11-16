# 🌐 Turnos_ya - Frontend Web Application

Aplicación web cliente (Single Page Application - SPA) de la plataforma **Turnos_ya**. Desarrollada con **React 19**, **Vite 8** y **TypeScript**, ofrece una interfaz moderna, accesible y de alto rendimiento tanto para clientes finales como para dueños de comercios y administradores globales del sistema.

---

## 🛠️ Stack Tecnológico

- **Biblioteca de UI**: [React 19](https://react.dev/) (v19.2)
- **Empaquetador y Bundler**: [Vite 8](https://vitejs.dev/) con ESM ultrarrápido
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (v6.0)
- **Enrutamiento y Transiciones**: [React Router DOM](https://reactrouter.com/) (v7.18) + motor nativo de **View Transitions API** (`transitionNavigator.ts`)
- **Cliente HTTP y Caché**: [Axios](https://axios-http.com/) (v1.19) con interceptores JWT y **Caché Reactiva en Memoria (`apiCache.ts`)** con invalidación automática por patrones en mutaciones
- **Autenticación Federada**: [Google Identity Services](https://developers.google.com/identity/gsi/web) (Google OAuth 2.0 con soporte para cuentas protegidas con 2FA)
- **Iconografía**: [Lucide React](https://lucide.dev/) (v1.31)
- **Manejo de Fechas**: [date-fns](https://date-fns.org/) (v4.4)
- **Pruebas y Calidad**: [Vitest](https://vitest.dev/) (v5.0) y [Oxlint](https://oxc.rs/docs/guide/usage/linter)
- **Sistema de Diseño**: CSS Vanilla nativo (`variables.css`, `global.css`, `notifications.css`, `loading-pagination.css`) con contenedor amplio de `1440px`, grilla de 4 columnas y cumplimiento de accesibilidad visual WCAG (`prefers-reduced-motion` y estabilidad de *hitbox* en hover).

---

## 📁 Estructura del Proyecto

```text
Turnos_ya_frontend_web-main/
├── public/                        # Recursos estáticos y favicons
├── src/
│   ├── assets/patterns/           # Patrones vectoriales de portadas de comercios
│   ├── components/                # Componentes estructurales y modulares
│   │   ├── common/
│   │   │   ├── BrandLogo.tsx              # Isotipo y logotipo escalable
│   │   │   ├── DefaultBusinessCover.tsx   # Portada con avatar alineado (Eje Izquierdo Unificado)
│   │   │   ├── GlobalAnnouncementBanner.tsx # Banner global de avisos del sistema
│   │   │   ├── LoadingSpinner.tsx         # Indicador de carga accesible
│   │   │   ├── Pagination.tsx             # Paginación reutilizable
│   │   │   └── SkeletonLoaders.tsx        # Esqueletos de carga (tarjetas, tablas y tickets)
│   │   ├── BugReportModal.tsx     # Modal de reporte de errores y solicitud de rubros
│   │   ├── CookieBanner.tsx       # Banner de consentimiento de cookies y privacidad
│   │   ├── FloatingReportButton.tsx # Botón flotante de soporte rápido
│   │   ├── Footer.tsx             # Pie de página estilo Mercado Libre con acordeón legal
│   │   ├── GoogleSignInButton.tsx # Autenticación OAuth 2.0 con manejo de 2FA
│   │   ├── Layout.tsx             # Shell principal: Navbar, banners, View Transitions y Footer
│   │   ├── LegalModals.tsx        # Modales legales (Términos, Privacidad Ley 25.326 y Cookies)
│   │   └── NotificationBell.tsx   # Centro de notificaciones en tiempo real vía SSE
│   ├── context/
│   │   └── AuthContext.tsx        # Estado global de sesión, usuario y limpieza de caché
│   ├── pages/                     # Vistas principales de la aplicación
│   │   ├── Booking.tsx            # Asistente de reserva en 3 pasos con Hold Token (10 min)
│   │   ├── BusinessDetail.tsx     # Ficha de comercio, comunidad, servicios, feriados y reseñas
│   │   ├── Dashboard.tsx          # Panel del dueño (agenda, turnos manuales, difusión, feriados)
│   │   ├── Home.tsx               # Portada amplia (1440px, 4 columnas, favoritos y cercanía GPS)
│   │   ├── Login.tsx              # Login clásico, Google OAuth y verificación 2FA TOTP
│   │   ├── MyAppointments.tsx     # Mis Turnos (próximos, historial, cancelación y reseñas)
│   │   ├── Profile.tsx            # Perfil, favoritos, email OTP, 2FA QR, cambio de clave y sesiones
│   │   ├── RecoverPassword.tsx    # Solicitud de recuperación de contraseña
│   │   ├── Register.tsx           # Registro de cuenta nueva
│   │   ├── RegisterBusiness.tsx   # Wizard de 4 pasos para postulación de comercios y rubros
│   │   ├── ResetPassword.tsx      # Restablecimiento de contraseña con token
│   │   ├── SystemAdmin.tsx        # Cockpit Ejecutivo de Administración (7 módulos)
│   │   └── VerifyEmail.tsx        # Verificación de correo en 1 clic o por código
│   ├── services/
│   │   ├── api.ts & api.test.ts           # Cliente Axios e interceptores
│   │   ├── apiCache.ts & apiCache.test.ts # Caché en memoria LRU + invalidación reactiva
│   │   ├── bugReportService.ts            # Servicio de tickets y reportes
│   │   ├── legalModalService.ts           # Bus de apertura de modales legales
│   │   └── notification.service.ts        # Servicio de notificaciones
│   ├── styles/
│   │   ├── global.css             # Sistema de diseño principal y layouts responsivos
│   │   ├── loading-pagination.css # Estilos de paginación y spinners
│   │   ├── notifications.css      # Estilos del centro de notificaciones
│   │   └── variables.css          # Tokens de color, sombras y tipografía
│   ├── types/                     # Contratos e interfaces TypeScript
│   ├── utils/                     # Helpers testeados (location, businessFilter, time, transitions)
│   ├── App.tsx                    # Árbol de rutas públicas y protegidas por rol
│   └── main.tsx                   # Punto de entrada React 19
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## ✨ Funcionalidades Principales

### 1. Portada de Alta Densidad y Eje Izquierdo Unificado (`Home.tsx`)
- Layout amplio de `1440px` con panel de filtros anclado a la izquierda y **grilla de 4 comercios por fila** en escritorio (12 comercios por página, adaptable a 3, 2 y 1 columna según pantalla).
- Tarjetas con **Eje Izquierdo Unificado** (avatar, título, insignias de rubro/apertura, chips de servicios y dirección alineados sobre el mismo eje vertical de 16px).
- Filtros combinados por categoría dinámica, búsqueda en tiempo real, **Mis Favoritos (`❤️`)** y **Cercanía GPS** (radio en km).

### 2. Comunidad, Favoritos y Reserva Segura (`BusinessDetail.tsx` & `Booking.tsx`)
- Seguimiento de comercios en 1 clic con interruptor de notificaciones, visualización de comunicados/promociones y aviso de próximos días cerrados por feriado.
- Botones de reserva con geometría estática en `:hover` (sin bucles de parpadeo ni *jitter* en los bordes, cumpliendo pautas WCAG de sensibilidad visual).
- Asistente de reserva en 3 pasos con **Hold Token transaccional de 10 minutos**.

### 3. Seguridad Avanzada y Gestión de Cuenta (`Profile.tsx`)
- **Doble Factor de Autenticación (2FA TOTP):** Vinculación con Google Authenticator mediante código QR y generación de **8 códigos de respaldo** de un solo uso.
- **Cambio / Configuración de Contraseña sin Fricción:** Verificación de identidad previa vía código OTP de 6 dígitos por correo o código 2FA, permitiendo a usuarios registrados con Google OAuth establecer o cambiar su contraseña sin pedir una clave anterior inexistente.
- **Dispositivos Vinculados (`Sesiones Activas`):** Control de sesiones abiertas con detección de navegador, sistema operativo, dirección IP y cierre remoto individual o total.
- **Mis Comercios Favoritos:** Panel dedicado para gestionar comercios seguidos y preferencias de alertas por local.

### 4. Panel del Dueño y Postulación de Comercios (`Dashboard.tsx` & `RegisterBusiness.tsx`)
- **Postulación en 4 Pasos (`RegisterBusiness.tsx`):** Alta de comercios con validación de identidad comercial (CUIT, Instagram, Facebook, Google Maps, Sitio Web) y solicitud de nuevos rubros.
- **Gestión Operativa (`Dashboard.tsx`):** Agenda diaria y semanal, carga de **turnos manuales**, difusión de comunicados a seguidores, bloqueo de **Modo Feriado / Días Cerrados**, catálogo de servicios, matriz de horarios y reporte de reseñas inapropiadas.

### 5. Cockpit Ejecutivo de Administración (`SystemAdmin.tsx`)
- **Jerarquía de Cuenta Raíz (`turnosyapp@gmail.com`):** Identificación visual con insignia `🛡️ Cuenta Raíz` (`Inmutable` 🔒). Únicamente la Cuenta Raíz puede promover o degradar a otros administradores o darlos de baja.
- **7 Módulos de Gestión:**
  1. **Centro de Control:** KPIs en vivo, Radar Anti-Sabotaje, Inspector Forense de turnos y exportación CSV.
  2. **Moderación de Comercios:** Aprobación/rechazo con dictamen, suspensión preventiva y **Cancelación Masiva por Emergencia / Fuerza Mayor**.
  3. **Gestor Dinámico de Rubros y Categorías:** ABM limpio de categorías comerciales con auto-slug y estado activo/inactivo.
  4. **Base de Usuarios:** Administración de roles y bajas con protección jerárquica.
  5. **Soporte y Tickets:** Resolución en 1 clic de solicitudes de nuevos rubros (`SOLICITUD_RUBRO`), moderación de reseñas (`MODERACION_RESENA`) y reportes de bugs (`BUG`).
  6. **Comunicados Globales (`GlobalAnnouncementBanner`) y Monitor de Caché (`L1`/`L2`).**
  7. **Bitácora de Auditoría Forense (`Audit Trail`).**

---

## ⚙️ Variables de Entorno (`.env`)

Crear un archivo `.env` en la raíz de `Turnos_ya_frontend_web-main`:

```env
# URL base del Backend API (se normaliza automáticamente con /api/v1)
VITE_API_URL=http://localhost:3000/api/v1

# Client ID de Google Cloud Console para OAuth 2.0
VITE_GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
```

---

## 🚀 Comandos de Ejecución

```bash
npm install          # Instalar dependencias
npm run dev          # Iniciar servidor de desarrollo en http://localhost:5173
npm test             # Ejecutar suite de pruebas unitarias con Vitest (27 tests)
npm run lint         # Analizar código con Oxlint
npm run build        # Verificar tipos TypeScript y compilar bundle de producción
npm run preview      # Previsualizar build de producción localmente
```
