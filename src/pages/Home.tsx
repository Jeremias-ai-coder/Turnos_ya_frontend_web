import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Building2, MapPin, Navigation, SlidersHorizontal, Sparkles, Star, X } from 'lucide-react';
import { SkeletonCard } from '../components/common/SkeletonLoaders';
import { Pagination } from '../components/common/Pagination';
import {
  type Coordinates,
  formatDistance,
  requestBrowserLocation,
  DEFAULT_DEMO_COORDS,
} from '../utils/locationHelper';
import { filterAndSortBusinesses } from '../utils/businessFilterHelper';
import { type Business } from '../types';

const DEFAULT_CATEGORIES = ['Todos', 'Peluquería', 'Estética', 'Salud', 'Deportes', 'Trámites', 'Mascotas', 'Otros'];

const normalizeText = (text: string = '') =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const Home: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filtered, setFiltered] = useState<Business[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [page, setPage] = useState(1);
  const PER_PAGE = 9;

  // Estados de Ubicación y Cercanía
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [sortByProximity, setSortByProximity] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string>('');

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await api.get('/businesses');
        const raw = res.data?.data ?? res.data;
        const data = Array.isArray(raw) ? raw : [];
        setBusinesses(data);
        setFiltered(data);
      } catch {
        setBusinesses([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        const raw = res.data?.data ?? res.data;
        if (Array.isArray(raw) && raw.length > 0) {
          setCategories(['Todos', ...raw.map((c: any) => c.name)]);
        }
      } catch {
        // Fallback to DEFAULT_CATEGORIES
      }
    };

    fetchBusinesses();
    fetchCategories();
  }, []);

  const handleGetLocation = async () => {
    setLocatingUser(true);
    const result = await requestBrowserLocation();
    setLocatingUser(false);

    if (result.status === 'granted' && result.coords) {
      setUserCoords(result.coords);
      setSortByProximity(true);
      setLocationLabel('Tu ubicación actual');
    } else {
      const useDemo = window.confirm(
        `${result.errorMessage || 'No se pudo obtener tu ubicación.'}\n\n¿Deseás activar el filtro de cercanía usando como referencia el Centro de CABA (Obelisco)?`
      );
      if (useDemo) {
        setUserCoords(DEFAULT_DEMO_COORDS);
        setSortByProximity(true);
        setLocationLabel('Centro CABA (Demo)');
      }
    }
  };

  const handleUseDemoLocation = () => {
    setUserCoords(DEFAULT_DEMO_COORDS);
    setSortByProximity(true);
    setLocationLabel('Centro CABA (Demo)');
  };

  const handleClearLocation = () => {
    setSortByProximity(false);
    setMaxDistanceKm(null);
    setUserCoords(null);
    setLocationLabel('');
  };

  useEffect(() => {
    const result = filterAndSortBusinesses(businesses, {
      searchQuery,
      selectedCategory,
      userCoords,
      sortByProximity,
      maxDistanceKm,
    });
    setFiltered(result as Business[]);
    setPage(1);
  }, [searchQuery, selectedCategory, businesses, userCoords, sortByProximity, maxDistanceKm]);

  const getCategoryCount = (cat: string) => {
    let list = Array.isArray(businesses) ? businesses : [];
    if (searchQuery) {
      const q = normalizeText(searchQuery);
      list = list.filter(b => {
        const inName = normalizeText(b?.name).includes(q);
        const inCat = normalizeText(b?.category).includes(q);
        const inAddr = normalizeText(b?.address).includes(q);
        const inDesc = normalizeText(b?.description).includes(q);
        const inServices = b?.services?.some(s =>
          normalizeText(s?.name).includes(q) ||
          normalizeText(s?.description).includes(q)
        );
        return inName || inCat || inAddr || inDesc || inServices;
      });
    }
    if (cat === 'Todos') return list.length;
    const normCat = normalizeText(cat);
    return list.filter(b => normalizeText(b?.category) === normCat).length;
  };

  const safeFiltered = Array.isArray(filtered) ? filtered : [];
  const totalPages = Math.ceil(safeFiltered.length / PER_PAGE);
  const paginated = safeFiltered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      <div className="two-col-layout">
        {/* Sidebar de filtros */}
        <aside className="sidebar-filters">
          <div className="filter-main-title-wrapper" style={{ marginBottom: '1.5rem' }}>
            <div className="filter-section-title">
              <SlidersHorizontal size={15} /> Filtros
            </div>
          </div>

          {/* Tu Ubicación y Cercanía */}
          <div className="location-filter-box" style={{ marginBottom: '1.25rem' }}>
            <div className="filter-section-title" style={{ fontSize: '0.78rem' }}>
              <Navigation size={13} color="var(--primary-color)" /> Cercanía y Ubicación
            </div>

            {!sortByProximity ? (
              <div>
                <p className="text-muted text-xs" style={{ marginBottom: '0.75rem' }}>
                  Activá la cercanía para ordenar comercios desde el más próximo a vos.
                </p>
                <button
                  onClick={handleGetLocation}
                  disabled={locatingUser}
                  className="btn btn-full"
                  style={{
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    padding: '9px 12px',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    backgroundColor: 'var(--status-pending-bg)',
                    color: 'var(--primary-color)',
                    border: '1.5px solid var(--status-pending-border)',
                    cursor: locatingUser ? 'not-allowed' : 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Navigation size={15} />
                  <span>{locatingUser ? 'Localizando...' : 'Usar mi ubicación'}</span>
                </button>
                <button
                  onClick={handleUseDemoLocation}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    width: '100%',
                    textDecoration: 'underline',
                    padding: '4px',
                  }}
                >
                  O probar con Centro CABA
                </button>
              </div>
            ) : (
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#0369a1' }}>
                    <Navigation size={13} color="#0284c7" />
                    <span>{locationLabel}</span>
                  </div>
                  <button
                    onClick={handleClearLocation}
                    title="Desactivar cercanía"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1', marginBottom: '6px', marginTop: '8px' }}>
                  Radio de distancia:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {[
                    { label: 'Todos', value: null },
                    { label: '< 3 km', value: 3 },
                    { label: '< 5 km', value: 5 },
                    { label: '< 10 km', value: 10 },
                  ].map(rad => {
                    const isSelected = maxDistanceKm === rad.value;
                    return (
                      <button
                        key={rad.label}
                        onClick={() => setMaxDistanceKm(rad.value)}
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: isSelected ? 700 : 500,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--primary-color)' : '#cbd5e1',
                          background: isSelected ? 'var(--primary-color)' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#475569',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {rad.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="divider filters-divider" />

          <div className="categories-filter-wrapper">
            <div className="filter-section-title categories-section-title" style={{ fontSize: '0.78rem', marginBottom: '0.6rem' }}>Categoría</div>
            <div className="category-filter-list">
              {categories.map(cat => {
                const count = getCategoryCount(cat);
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`category-filter-btn ${isSelected ? 'selected' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSelected ? 'var(--status-pending-bg)' : 'transparent',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--primary-color)' : 'transparent',
                      color: isSelected ? 'var(--primary-color)' : 'var(--text-main)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.88rem',
                      fontFamily: 'var(--font-family-base)',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <span>{cat}</span>
                    <span
                      className="category-count-badge"
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: isSelected ? 'var(--primary-color)' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#64748b',
                        minWidth: '22px',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                        marginLeft: '8px',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Columna de negocios */}
        <div className="two-col-content" style={{ width: '100%', minWidth: 0 }}>
          {sortByProximity && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 1rem',
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              borderRadius: '10px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#0369a1',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <Navigation size={14} color="#0284c7" />
                Ordenando comercios por cercanía ({locationLabel})
                {maxDistanceKm !== null && ` · Radio: < ${maxDistanceKm} km`}
              </span>
              <button
                onClick={handleClearLocation}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.80rem',
                  textDecoration: 'underline',
                }}
              >
                Quitar cercanía
              </button>
            </div>
          )}

          {searchQuery && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              fontSize: '0.88rem',
              color: '#0369a1',
            }}>
              <span>
                Resultados para: <strong>"{searchQuery}"</strong> ({safeFiltered.length} {safeFiltered.length === 1 ? 'encontrado' : 'encontrados'})
              </span>
              <button
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('q');
                  setSearchParams(newParams);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  textDecoration: 'underline',
                }}
              >
                Limpiar búsqueda
              </button>
            </div>
          )}

          {loading ? (
            <div className="business-grid">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : paginated.length === 0 ? (
            <div className="empty-state">
              <Building2 size={48} color="var(--text-disabled)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--text-title)' }}>No se encontraron negocios</h3>
              <p className="text-muted text-sm">Intentá con otras palabras clave o cambiá los filtros.</p>
            </div>
          ) : (
            <>
              <div className="business-grid">
                {paginated.map(business => (
                  <Link to={`/businesses/${business.id}`} key={business.id} style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
                    <div className="ml-card ml-card-hoverable" style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                      {/* Imagen / Avatar */}
                      <div style={{ height: '120px', background: 'linear-gradient(180deg, #f8fbfd, #ffffff)', borderBottom: '1px solid #f1f5f9', borderTopLeftRadius: '13px', borderTopRightRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                          width: '64px', height: '64px', borderRadius: '12px',
                          background: 'linear-gradient(135deg, #e6f5fc, #ffffff)',
                          color: 'var(--primary-color)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '1.25rem',
                          border: '1px solid #cce9f8', boxShadow: '0 4px 10px rgba(0, 158, 227, 0.05)'
                        }}>
                          {business.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      </div>

                      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ color: 'var(--text-title)', fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                          {business.name}
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          {business.category && (
                            <span className="badge badge-confirmed" style={{ fontSize: '0.75rem' }}>
                              {business.category}
                            </span>
                          )}
                          {business.distanceKm !== undefined && (
                            <span style={{
                              fontSize: '0.73rem',
                              fontWeight: 700,
                              color: '#0284c7',
                              background: '#e0f2fe',
                              border: '1px solid #bae6fd',
                              borderRadius: '4px',
                              padding: '1px 6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}>
                              <Navigation size={10} />
                              {formatDistance(business.distanceKm)}
                            </span>
                          )}
                        </div>
                        {business.description && (
                          <p className="text-muted text-sm" style={{
                            marginBottom: '8px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.35
                          }}>
                            {business.description}
                          </p>
                        )}

                        {/* Coincidencia destacada de servicio cuando se busca */}
                        {searchQuery && business.services && business.services.length > 0 && (() => {
                          const q = normalizeText(searchQuery);
                          const matching = business.services.filter(s =>
                            normalizeText(s.name).includes(q) || (s.description && normalizeText(s.description).includes(q))
                          );
                          if (matching.length === 0) return null;
                          return (
                            <div style={{
                              marginBottom: '8px',
                              padding: '5px 8px',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              color: '#166534',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Sparkles size={12} color="#16a34a" />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                Servicio: {matching.map(s => s.name).join(', ')}
                              </span>
                            </div>
                          );
                        })()}

                        {/* Chips de vista previa de servicios cuando no hay búsqueda */}
                        {!searchQuery && business.services && business.services.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                            {business.services.slice(0, 2).map(s => (
                              <span key={s.id} style={{
                                fontSize: '0.70rem',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                color: '#475569',
                                borderRadius: '4px',
                                padding: '1px 6px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '140px',
                                whiteSpace: 'nowrap'
                              }}>
                                {s.name}
                              </span>
                            ))}
                            {business.services.length > 2 && (
                              <span style={{ fontSize: '0.70rem', color: '#94a3b8', alignSelf: 'center' }}>
                                +{business.services.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                        {business.address && (
                          <p className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                            <MapPin size={13} /> {business.address}
                          </p>
                        )}
                        {business.phone && (
                          <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                            {business.phone}
                          </p>
                        )}
                      </div>

                      <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--star-color)', fontSize: '0.82rem', fontWeight: 600 }}>
                          <Star size={13} fill="currentColor" /> {business.rating ? `${business.rating.toFixed(1)}${business.reviewCount ? ` (${business.reviewCount})` : ''}` : 'Nuevo'}
                        </div>
                        <span style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '0.85rem' }}>Ver turnos →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Paginación */}
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={safeFiltered.length}
                itemsPerPage={PER_PAGE}
                onPageChange={setPage}
                itemLabel="negocios"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
