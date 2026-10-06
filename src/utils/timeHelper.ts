/**
 * Utilidades centralizadas para manejo de horas de reloj (Wall-clock time)
 * Evita desplazamientos indeseados causados por la zona horaria del navegador (ej: UTC-3).
 */

/**
 * Convierte cualquier representación de hora (string "HH:mm", "HH:mm:ss", ISO Date string o Date)
 * al formato estándar "HH:mm" (24 horas) sin alterar la hora por huso horario.
 */
export function formatTimeToHHMM(timeInput: string | Date | null | undefined): string {
  if (!timeInput) return '--:--';

  if (timeInput instanceof Date) {
    if (isNaN(timeInput.getTime())) return '--:--';
    const hours = String(timeInput.getUTCHours()).padStart(2, '0');
    const minutes = String(timeInput.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const str = String(timeInput).trim();

  // Si contiene formato ISO ("1970-01-01T09:00:00.000Z" o "2026-09-01T09:00:00")
  if (str.includes('T')) {
    const timePart = str.split('T')[1];
    const match = timePart.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      return `${match[1].padStart(2, '0')}:${match[2]}`;
    }
  }

  // Si es directamente "09:00" o "09:00:00" o "9:00"
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }

  return str;
}

/**
 * Convierte un string "HH:mm" a string ISO estándar para la API ("1970-01-01THH:mm:00.000Z")
 */
export function toISOTimeString(timeStr: string): string {
  const formatted = formatTimeToHHMM(timeStr);
  if (formatted === '--:--') return '1970-01-01T00:00:00.000Z';
  return `1970-01-01T${formatted}:00.000Z`;
}

/**
 * Calcula las horas restantes hasta un turno combinando la fecha YYYY-MM-DD y la hora HH:mm en UTC
 */
export function getHoursUntilAppointment(dateStr: string, timeStr: string): number {
  try {
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const timeFormatted = formatTimeToHHMM(timeStr);
    const [hours, minutes] = timeFormatted.split(':').map(Number);

    const startLocal = new Date(year, month - 1, day, hours || 0, minutes || 0, 0);
    const now = new Date();
    return (startLocal.getTime() - now.getTime()) / (1000 * 60 * 60);
  } catch {
    return 0;
  }
}

/**
 * Redondea la duración del servicio a bloques modulares de 30 minutos (mínimo 30 min: medio turno).
 * Ejemplos:
 *  1 a 30 min -> 30 min (1 bloque)
 *  31 a 60 min -> 60 min (2 bloques / 1 hora)
 *  61 a 90 min -> 90 min (3 bloques / 1h 30m)
 */
export function getEffectiveDurationMinutes(durationMinutes: number = 30): number {
  const duration = Number(durationMinutes) || 30;
  if (duration <= 0) return 30;
  return Math.max(30, Math.ceil(duration / 30) * 30);
}

/**
 * Genera la lista de horarios de turnos ("HH:mm") dentro de un rango de atención (apertura y cierre)
 * respetando la grilla estándar de 30 minutos (pasos de 30 min: :00 y :30).
 * Un turno solo es válido si (hora_inicio + duracion_efectiva <= hora_cierre).
 */
export function generateSlotsForSchedule(
  startTimeStr: string,
  endTimeStr: string,
  durationMinutes: number = 30
): string[] {
  const startFormatted = formatTimeToHHMM(startTimeStr);
  const endFormatted = formatTimeToHHMM(endTimeStr);

  if (startFormatted === '--:--' || endFormatted === '--:--') return [];

  const [startH, startM] = startFormatted.split(':').map(Number);
  const [endH, endM] = endFormatted.split(':').map(Number);

  const startTotalM = startH * 60 + startM;
  const endTotalM = endH * 60 + endM;

  const effectiveDuration = getEffectiveDurationMinutes(durationMinutes);
  const step = 30; // Los turnos siempre inician en múltiplos de 30 minutos (:00 o :30)
  const slots: string[] = [];

  for (let m = startTotalM; m + effectiveDuration <= endTotalM; m += step) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }

  return slots;
}
