import axios from 'axios';

// Si se define VITE_API_URL en el archivo .env se usa esa URL;
// de lo contrario, se usa '/api/v1' que aprovecha el proxy de Vite en desarrollo.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Solicitud (Request): Inyectar el token JWT si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuesta (Response): Manejo centralizado de respuestas y errores
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es HTML (por ejemplo si una ruta 404 devuelve index.html en Vercel)
    if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      return Promise.reject(new Error('Respuesta no válida del backend: se recibió HTML en lugar de JSON. Verifica la variable VITE_API_URL.'));
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, config } = error.response;

      // Si el error es 401 (No autorizado / Token vencido) y no es el endpoint de login
      if (status === 401 && !config.url?.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

