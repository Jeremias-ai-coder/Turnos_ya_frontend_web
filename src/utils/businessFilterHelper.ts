import { type Coordinates, calculateDistanceKm } from './locationHelper';

export interface BusinessItem {
  id: number;
  name: string;
  address?: string;
  category?: string;
  description?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  distanceKm?: number;
  services?: Array<{ name: string; description?: string }>;
}

export interface FilterOptions {
  searchQuery?: string;
  selectedCategory?: string;
  userCoords?: Coordinates | null;
  sortByProximity?: boolean;
  maxDistanceKm?: number | null;
}

export const normalizeText = (text: string = '') =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function filterAndSortBusinesses(
  businesses: BusinessItem[],
  options: FilterOptions = {}
): BusinessItem[] {
  let result = Array.isArray(businesses) ? [...businesses] : [];
  const { searchQuery = '', selectedCategory = 'Todos', userCoords, sortByProximity, maxDistanceKm } = options;

  // 1. Calcular distancia si hay coordenadas de usuario
  if (userCoords) {
    result = result.map((b) => {
      if (b.latitude != null && b.longitude != null) {
        const lat = Number(b.latitude);
        const lon = Number(b.longitude);
        if (!isNaN(lat) && !isNaN(lon)) {
          const dist = calculateDistanceKm(userCoords.latitude, userCoords.longitude, lat, lon);
          return { ...b, distanceKm: dist };
        }
      }
      return b;
    });
  }

  // 2. Búsqueda de texto (nombre, categoría, dirección, servicios)
  if (searchQuery.trim()) {
    const q = normalizeText(searchQuery);
    result = result.filter((b) => {
      const inName = normalizeText(b.name).includes(q);
      const inCat = normalizeText(b.category).includes(q);
      const inAddr = normalizeText(b.address).includes(q);
      const inDesc = normalizeText(b.description).includes(q);
      const inServices = b.services?.some(
        (s) => normalizeText(s.name).includes(q) || normalizeText(s.description).includes(q)
      );
      return inName || inCat || inAddr || inDesc || inServices;
    });
  }

  // 3. Filtro por categoría seleccionada
  if (selectedCategory && selectedCategory !== 'Todos') {
    const normCat = normalizeText(selectedCategory);
    result = result.filter((b) => normalizeText(b.category) === normCat);
  }

  // 4. Filtro por radio de cercanía
  if (sortByProximity && maxDistanceKm !== null && maxDistanceKm !== undefined) {
    result = result.filter((b) => b.distanceKm !== undefined && b.distanceKm <= maxDistanceKm);
  }

  // 5. Ordenamiento por menor distancia
  if (sortByProximity) {
    result.sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999));
  }

  return result;
}
