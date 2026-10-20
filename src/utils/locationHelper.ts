export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Ubicación de referencia en el centro de CABA (Obelisco / Microcentro)
export const DEFAULT_DEMO_COORDS: Coordinates = {
  latitude: -34.6037,
  longitude: -58.3816,
};

/**
 * Calcula la distancia en línea recta en kilómetros entre dos coordenadas
 * utilizando la fórmula de Haversine.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formatea una distancia en kilómetros a un texto legible para el usuario
 * Ejemplos: "450 m" si es menor a 1 km, "2.4 km" si es mayor o igual.
 */
export function formatDistance(km: number | null | undefined): string {
  if (km === null || km === undefined || isNaN(km)) return '';
  if (km < 1) {
    const meters = Math.max(50, Math.round(km * 1000));
    return `${meters} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Solicita la ubicación actual del usuario a través de la API Geolocation del navegador.
 */
export function requestBrowserLocation(): Promise<{
  coords: Coordinates | null;
  status: 'granted' | 'denied' | 'unsupported';
  errorMessage?: string;
}> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        coords: null,
        status: 'unsupported',
        errorMessage: 'Tu navegador no soporta geolocalización.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          status: 'granted',
        });
      },
      (error) => {
        let msg = 'No se pudo obtener tu ubicación.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permiso de ubicación denegado en el navegador.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Información de ubicación no disponible.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Tiempo de espera agotado al consultar ubicación.';
        }
        resolve({
          coords: null,
          status: 'denied',
          errorMessage: msg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
