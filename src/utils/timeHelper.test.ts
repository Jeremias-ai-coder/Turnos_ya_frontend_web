import { describe, it, expect } from 'vitest';
import {
  formatTimeToHHMM,
  toISOTimeString,
  getHoursUntilAppointment,
} from './timeHelper';

describe('timeHelper (Unit Tests - Frontend Web)', () => {
  describe('formatTimeToHHMM', () => {
    it('debe formatear strings ISO extrayendo correctamente HH:mm', () => {
      expect(formatTimeToHHMM('1970-01-01T15:30:00.000Z')).toBe('15:30');
      expect(formatTimeToHHMM('2026-10-15T09:05:00.000Z')).toBe('09:05');
    });

    it('debe mantener o normalizar strings directos de hora HH:mm', () => {
      expect(formatTimeToHHMM('14:00')).toBe('14:00');
      expect(formatTimeToHHMM('9:30')).toBe('09:30');
      expect(formatTimeToHHMM('18:45:30')).toBe('18:45');
    });

    it('debe convertir instancias de Date en formato HH:mm UTC', () => {
      const date = new Date('1970-01-01T16:00:00.000Z');
      expect(formatTimeToHHMM(date)).toBe('16:00');
    });

    it('debe retornar "--:--" para inputs vacíos, nulos o no válidos', () => {
      expect(formatTimeToHHMM(null)).toBe('--:--');
      expect(formatTimeToHHMM(undefined)).toBe('--:--');
      expect(formatTimeToHHMM('')).toBe('--:--');
      expect(formatTimeToHHMM(new Date('fecha-invalida'))).toBe('--:--');
    });
  });

  describe('toISOTimeString', () => {
    it('debe convertir un string HH:mm al formato ISO 1970-01-01THH:mm:00.000Z', () => {
      expect(toISOTimeString('17:00')).toBe('1970-01-01T17:00:00.000Z');
      expect(toISOTimeString('08:30')).toBe('1970-01-01T08:30:00.000Z');
    });

    it('debe manejar entradas no estándar con valor por defecto', () => {
      expect(toISOTimeString('')).toBe('1970-01-01T00:00:00.000Z');
    });
  });

  describe('getHoursUntilAppointment', () => {
    it('debe calcular horas positivas para un turno futuro', () => {
      const future = new Date(Date.now() + 6 * 60 * 60 * 1000);
      const dateStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(future.getHours()).padStart(2, '0')}:${String(future.getMinutes()).padStart(2, '0')}`;

      const hours = getHoursUntilAppointment(dateStr, timeStr);
      expect(hours).toBeGreaterThan(5);
      expect(hours).toBeLessThanOrEqual(7);
    });

    it('debe calcular horas negativas para un turno pasado', () => {
      const past = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const dateStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(past.getHours()).padStart(2, '0')}:${String(past.getMinutes()).padStart(2, '0')}`;

      const hours = getHoursUntilAppointment(dateStr, timeStr);
      expect(hours).toBeLessThan(0);
    });
  });
});
