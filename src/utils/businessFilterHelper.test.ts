import { describe, it, expect } from 'vitest';
import {
  filterAndSortBusinesses,
  type BusinessItem,
  normalizeText,
} from './businessFilterHelper';

describe('businessFilterHelper (Unit Tests - Frontend Web)', () => {
  const mockBusinesses: BusinessItem[] = [
    {
      id: 1,
      name: 'Barbería Premium',
      category: 'Barbería',
      address: 'Palermo Soho, CABA',
      latitude: -34.5885,
      longitude: -58.4285,
      services: [{ name: 'Corte Clásico' }, { name: 'Afeitado' }],
    },
    {
      id: 2,
      name: 'Peluquería Estilo & Arte',
      category: 'Peluquería',
      address: 'Recoleta, CABA',
      latitude: -34.5875,
      longitude: -58.3974,
      services: [{ name: 'Tintura y Alisado' }],
    },
    {
      id: 3,
      name: 'Clínica Dental Sonrisas',
      category: 'Salud',
      address: 'Microcentro, CABA',
      latitude: -34.6045,
      longitude: -58.3795,
      services: [{ name: 'Limpieza Dental' }],
    },
  ];

  it('normalizeText debe remover acentos y convertir a minúsculas', () => {
    expect(normalizeText('Barbería Óptima Éxito')).toBe('barberia optima exito');
  });

  it('debe filtrar por texto en el nombre, categoría o servicio', () => {
    const byName = filterAndSortBusinesses(mockBusinesses, { searchQuery: 'Premium' });
    expect(byName).toHaveLength(1);
    expect(byName[0].name).toBe('Barbería Premium');

    const byService = filterAndSortBusinesses(mockBusinesses, { searchQuery: 'Tintura' });
    expect(byService).toHaveLength(1);
    expect(byService[0].name).toBe('Peluquería Estilo & Arte');
  });

  it('debe filtrar por categoría seleccionada', () => {
    const result = filterAndSortBusinesses(mockBusinesses, { selectedCategory: 'Salud' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  it('debe calcular distancias y ordenar de menor a mayor cuando sortByProximity está activo', () => {
    // Usuario ubicado en el Obelisco (-34.6037, -58.3816)
    // El más cercano es Clínica Dental Sonrisas (Microcentro, ~200 m)
    // El segundo más cercano es Recoleta (~2.3 km)
    // El más lejano es Palermo (~4.6 km)
    const userCoords = { latitude: -34.6037, longitude: -58.3816 };
    const result = filterAndSortBusinesses(mockBusinesses, {
      userCoords,
      sortByProximity: true,
    });

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(3); // Microcentro
    expect(result[1].id).toBe(2); // Recoleta
    expect(result[2].id).toBe(1); // Palermo
    expect(result[0].distanceKm).toBeLessThan(result[1].distanceKm!);
    expect(result[1].distanceKm).toBeLessThan(result[2].distanceKm!);
  });

  it('debe limitar los comercios al radio maxDistanceKm', () => {
    const userCoords = { latitude: -34.6037, longitude: -58.3816 };
    // Radio de 1 km: sólo debe incluir a Microcentro (~200m)
    const result = filterAndSortBusinesses(mockBusinesses, {
      userCoords,
      sortByProximity: true,
      maxDistanceKm: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });
});
