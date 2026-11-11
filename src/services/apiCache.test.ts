import { describe, it, expect, beforeEach } from 'vitest';
import { ClientCacheManager } from './apiCache';

describe('ClientCacheManager (Frontend Web)', () => {
  let cache: ClientCacheManager;

  beforeEach(() => {
    cache = new ClientCacheManager();
  });

  it('debe almacenar y recuperar valores en caché antes del TTL', () => {
    cache.set('/api/v1/categories', [{ id: 1, name: 'Barbería' }], 30);
    const result = cache.get<any>('/api/v1/categories');

    expect(result).toEqual([{ id: 1, name: 'Barbería' }]);
    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(0);
  });

  it('debe devolver null cuando la clave no existe', () => {
    const result = cache.get('/inexistente');
    expect(result).toBeNull();
    const stats = cache.getStats();
    expect(stats.misses).toBe(1);
  });

  it('debe invalidar claves automáticamente ante mutaciones en appointments', () => {
    cache.set('/api/v1/appointments/my', [{ id: 10 }]);
    cache.set('/api/v1/businesses/1/busy-slots?date=2026-10-28', ['10:00']);
    cache.set('/api/v1/categories', [{ id: 1 }]);

    cache.handleMutation('/api/v1/appointments/10/cancel');

    // Deben haberse invalidado appointments y busy-slots
    expect(cache.get('/api/v1/appointments/my')).toBeNull();
    expect(cache.get('/api/v1/businesses/1/busy-slots?date=2026-10-28')).toBeNull();
    // Categories no debe verse afectada
    expect(cache.get('/api/v1/categories')).not.toBeNull();
  });

  it('debe limpiar todo el almacenamiento con clear()', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();

    expect(cache.get('a')).toBeNull();
    expect(cache.getStats().size).toBe(0);
  });
});
