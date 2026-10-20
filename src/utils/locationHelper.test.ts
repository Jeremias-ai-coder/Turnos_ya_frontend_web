import { describe, it, expect } from 'vitest';
import {
  calculateDistanceKm,
  formatDistance,
  DEFAULT_DEMO_COORDS,
} from './locationHelper';

describe('locationHelper (Unit Tests - Frontend Web)', () => {
  describe('calculateDistanceKm', () => {
    it('debe calcular la distancia precisa entre dos coordenadas conocidas (Obelisco a Palermo Soho)', () => {
      // Obelisco (-34.6037, -58.3816) a Palermo Soho (-34.5885, -58.4285)
      const dist = calculateDistanceKm(
        DEFAULT_DEMO_COORDS.latitude,
        DEFAULT_DEMO_COORDS.longitude,
        -34.5885,
        -58.4285
      );

      // La distancia real en línea recta es aproximadamente entre 4.5 y 4.8 km
      expect(dist).toBeGreaterThan(4.2);
      expect(dist).toBeLessThan(5.0);
    });

    it('debe retornar 0 si las coordenadas de origen y destino son idénticas', () => {
      const dist = calculateDistanceKm(-34.6037, -58.3816, -34.6037, -58.3816);
      expect(dist).toBe(0);
    });

    it('debe retornar 0 si alguno de los parámetros no es un número o es NaN', () => {
      expect(calculateDistanceKm(NaN, -58.38, -34.60, -58.38)).toBe(0);
      expect(calculateDistanceKm(-34.60, NaN, -34.60, -58.38)).toBe(0);
      expect(calculateDistanceKm(undefined as any, -58.38, -34.60, -58.38)).toBe(0);
    });
  });

  describe('formatDistance', () => {
    it('debe formatear distancias menores a 1 km en metros redondeados', () => {
      expect(formatDistance(0.35)).toBe('350 m');
      expect(formatDistance(0.02)).toBe('50 m'); // Mínimo 50 metros para distancias muy cortas
      expect(formatDistance(0.85)).toBe('850 m');
    });

    it('debe formatear distancias de 1 km o más con un decimal y sufijo "km"', () => {
      expect(formatDistance(1.23)).toBe('1.2 km');
      expect(formatDistance(4.56)).toBe('4.6 km');
      expect(formatDistance(10)).toBe('10.0 km');
    });

    it('debe retornar string vacío para valores nulos, indefinidos o NaN', () => {
      expect(formatDistance(null)).toBe('');
      expect(formatDistance(undefined)).toBe('');
      expect(formatDistance(NaN)).toBe('');
    });
  });
});
