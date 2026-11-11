import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from './api';

const storage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => {
    storage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  },
};

globalThis.localStorage = mockLocalStorage as any;
globalThis.window = {
  location: { pathname: '/appointments', href: '/appointments' },
} as any;

describe('api service interceptors (Unit Tests - Frontend Web)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('debe inyectar la cabecera Authorization cuando existe un token en localStorage', async () => {
    localStorage.setItem('token', 'jwt-token-de-prueba');

    // Ejecutar el handler de request interceptor directamente
    const interceptor = (api.interceptors.request as any).handlers[0];
    const config = { headers: {} as any };

    const modifiedConfig = interceptor.fulfilled(config);
    expect(modifiedConfig.headers.Authorization).toBe('Bearer jwt-token-de-prueba');
  });

  it('no debe inyectar la cabecera Authorization si no hay token en localStorage', async () => {
    const interceptor = (api.interceptors.request as any).handlers[0];
    const config = { headers: {} as any };

    const modifiedConfig = interceptor.fulfilled(config);
    expect(modifiedConfig.headers.Authorization).toBeUndefined();
  });

  it('debe rechazar la promesa si la respuesta contiene HTML en lugar de JSON (proxy fallback error)', async () => {
    const interceptor = (api.interceptors.response as any).handlers[0];
    const htmlResponse = {
      data: '<!DOCTYPE html><html><body>Error</body></html>',
    };

    await expect(interceptor.fulfilled(htmlResponse)).rejects.toThrow(
      'Respuesta no válida del backend'
    );
  });

  it('debe limpiar token y credenciales si recibe un status 401 en una ruta protegida', async () => {
    localStorage.setItem('token', 'token-expirado');
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'user@test.com' }));

    const interceptor = (api.interceptors.response as any).handlers[0];
    const error401 = {
      response: {
        status: 401,
        config: { url: '/appointments/my-appointments' },
      },
    };

    await expect(interceptor.rejected(error401)).rejects.toBeDefined();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
