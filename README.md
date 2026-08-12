# Turnos_ya - Frontend Web Application

Aplicación web cliente (Single Page Application - SPA) de la plataforma **Turnos_ya**. Desarrollada con React 19, Vite y TypeScript, ofrece una interfaz moderna, fluida e intuitiva tanto para clientes que buscan reservar turnos como para prestadores de servicios que gestionan sus comercios y agendas.

---

## 🛠️ Stack Tecnológico

- **Biblioteca de UI**: [React 19](https://react.dev/)
- **Herramienta de Construcción / Bundler**: [Vite 8](https://vitejs.dev/)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (v6.0)
- **Enrutamiento**: [React Router DOM](https://reactrouter.com/) (v7.18)
- **Cliente HTTP**: [Axios](https://axios-http.com/) (v1.19) con interceptores para inyección de token JWT
- **Iconografía**: [Lucide React](https://lucide.dev/) (v1.31)
- **Manejo de Fechas**: [date-fns](https://date-fns.org/) (v4.4)
- **Linter**: [Oxlint](https://oxc.rs/docs/guide/usage/linter)
- **Estilos**: Custom Design System basado en CSS Vanilla con variables nativas (`variables.css` y `global.css`)

---

## 📁 Estructura del Proyecto

```text
Turnos_ya_frontend_web-main/
├── public/                 # Archivos estáticos e íconos de la aplicación
├── src/
│   ├── components/         # Componentes estructurales y reutilizables
│   │   └── Layout.tsx      # Estructura base con Header/Navbar, Footer y navegación responsiva
│   ├── context/            # Proveedores de estado global (Context API)
│   │   └── AuthContext.tsx # Estado global de autenticación, usuario actual y persistencia de JWT
│   ├── pages/              # Vistas y pantallas principales de la aplicación
│   │   ├── Home.tsx            # Landing page con buscador, filtros por categoría y listado de comercios
│   │   ├── Login.tsx           # Formulario de inicio de sesión de usuarios
│   │   ├── Register.tsx        # Formulario de registro (Clientes y Dueños de Comercio)
│   │   ├── Dashboard.tsx       # Panel de gestión para dueños de comercios (servicios, agenda y turnos)
│   │   ├── BusinessDetail.tsx  # Vista detallada de un comercio (servicios, ubicación y horarios)
│   │   ├── Booking.tsx         # Asistente interactivo de reserva de turnos (paso a paso)
│   │   ├── MyAppointments.tsx  # Historial y gestión de turnos del cliente (confirmados, pendientes, cancelados)
│   │   ├── Profile.tsx         # Gestión del perfil de usuario y preferencias de notificación
│   │   └── SystemAdmin.tsx     # Panel de administración global del sistema (moderación y aprobaciones)
│   ├── services/           # Capa de integración y llamadas a la API
│   │   └── api.ts          # Instancia configurada de Axios con baseURL e interceptor JWT
│   ├── styles/             # Tokens de diseño y hoja de estilos global
│   │   ├── variables.css   # Variables CSS (paleta de colores, tipografías, sombras, radios)
│   │   └── global.css      # Reset, layout flexbox/grid, cards, botones, modales y animaciones
│   ├── App.tsx             # Configuración del enrutador y rutas protegidas/públicas
│   ├── App.css             # Estilos específicos del contenedor principal
│   ├── index.css           # Carga de tipografías y estilos base
│   └── main.tsx            # Punto de entrada y montaje de React en el DOM
├── index.html              # Plantilla HTML5 principal
├── package.json            # Dependencias y scripts de desarrollo/construcción
├── tsconfig.json           # Configuración de TypeScript
└── vite.config.ts          # Configuración del servidor Vite y plugins
```

---

## ⚙️ Funcionalidades Principales

### 1. Exploración y Búsqueda de Comercios (`Home.tsx` & `BusinessDetail.tsx`)
- Filtrado dinámico por categorías (Barbería, Estética, Salud, Deportes, etc.).
- Búsqueda en tiempo real por nombre de comercio o palabra clave.
- Ficha completa del comercio con mapa/coordenadas, horarios y listado de servicios.

### 2. Flujo de Reserva de Turnos (`Booking.tsx`)
- Selección interactiva de servicio, profesional o fecha deseada.
- Bloqueo temporal del turno (*hold token*) mientras se completa el formulario de reserva.
- Confirmación instantánea del turno reservado.

### 3. Panel del Dueño / Prestador (`Dashboard.tsx`)
- Administración de servicios offered (precios, duraciones, estados).
- Configuración de días y franjas horarias de atención.
- Vista de agenda de turnos recibidos con cambio de estado (`CONFIRMED`, `COMPLETED`, `CANCELLED`).

### 4. Gestión del Cliente (`MyAppointments.tsx` & `Profile.tsx`)
- Consulta del historial de turnos con indicador visual de estado.
- Posibilidad de cancelar reservas vigentes respetando las políticas del servicio.
- Configuración de notificaciones (Email / WhatsApp).

---

## 🚀 Comandos de Ejecución

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible por defecto en `http://localhost:5173`.

3. **Ejecutar validación de linter**:
   ```bash
   npm run lint
   ```

4. **Compilar para producción**:
   ```bash
   npm run build
   ```

5. **Previsualizar la compilación**:
   ```bash
   npm run preview
   ```
