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

    const startUtc = new Date(Date.UTC(year, month - 1, day, hours || 0, minutes || 0, 0));
    const nowUtc = new Date();
    return (startUtc.getTime() - nowUtc.getTime()) / (1000 * 60 * 60);
  } catch {
    return 0;
  }
}
