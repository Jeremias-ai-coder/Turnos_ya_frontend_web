import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { startSmoothNavigation } from '../utils/transitionNavigator';
import api, { cachedGet, clientCache } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building2, Heart, MapPin, Navigation, SlidersHorizontal, Sparkles, Star, X } from 'lucide-react';
import { SkeletonCard } from '../components/common/SkeletonLoaders';
import { Pagination } from '../components/common/Pagination';
import { DefaultBusinessCover } from '../components/common/DefaultBusinessCover';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const cachedBizData = clientCache.get<any>('/businesses?{}');
  const cachedList: Business[] = Array.isArray(cachedBizData?.data) ? cachedBizData.data : (Array.isArray(cachedBizData) ? cachedBizData : []);

  const [businesses, setBusinesses] = useState<Business[]>(cachedList);
  const [filtered, setFiltered] = useState<Business[]>(cachedList);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(cachedList.length === 0);
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

  // Estados de Favoritos / Comercios Seguidos
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(() => searchParams.get('favs') === '1');

  useEffect(() => {
    setOnlyFavorites(searchParams.get('favs') === '1');
  }, [searchParams]);

  const toggleOnlyFavoritesFilter = (nextVal?: boolean) => {
    const target = typeof nextVal === 'boolean' ? nextVal : !onlyFavorites;
    setOnlyFavorites(target);
    const nextParams = new URLSearchParams(searchParams);
    if (target) {
      nextParams.set('favs', '1');
    } else {
      nextParams.delete('favs');
    }
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      setOnlyFavorites(false);
      return;
    }
    api.get('/businesses/my/favorites')
      .then(res => {
        const list = res.data?.data ?? res.data ?? [];
        if (Array.isArray(list)) {
          setFavoriteIds(list.map((f: any) => Number(f.businessId)));
        }
      })
      .catch(() => {});
  }, [user]);

  const handleToggleFavorite = async (e: React.MouseEvent, businessId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    const wasFav = favoriteIds.includes(businessId);
    setFavoriteIds(prev => wasFav ? prev.filter(id => id !== businessId) : [...prev, businessId]);
    try {
      const res = await api.post(`/businesses/${businessId}/follow`);
      const isFollowing = res.data?.data?.isFollowing;
      if (typeof isFollowing === 'boolean') {
        setFavoriteIds(prev =>
          isFollowing
            ? (prev.includes(businessId) ? prev : [...prev, businessId])
            : prev.filter(id => id !== businessId)
        );
      }
    } catch {
      // Revertir en caso de error
      setFavoriteIds(prev => wasFav ? [...prev, businessId] : prev.filter(id => id !== businessId));
    }
  };

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const resData = await cachedGet('/businesses', undefined, 120);
        const raw = resData?.data ?? resData;
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
        const resData = await cachedGet('/categories', undefined, 600);
        const raw = resData?.data ?? resData;
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
    let result = filterAndSortBusinesses(businesses, {
      searchQuery,
      selectedCategory,
      userCoords,
      sortByProximity,
      maxDistanceKm,
    }) as Business[];
    if (onlyFavorites) {
      result = result.filter(b => favoriteIds.includes(b.id));
    }
    setFiltered(result);
    setPage(1);
  }, [searchQuery, selectedCategory, businesses, userCoords, sortByProximity, maxDistanceKm, onlyFavorites, favoriteIds]);

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
          <div className="filter-main-title-wrapper" style={{ marginBottom: '1.25rem' }}>
            <div className="filter-section-title">
              <SlidersHorizontal size={15} /> Filtros
            </div>
          </div>

          {/* Barra Rápida Mobile: Favoritos + Cercanía en 1 sola fila compacta */}
          <div className="mobile-quick-filters-bar">
            {user && (
              <button
                type="button"
                onClick={() => toggleOnlyFavoritesFilter()}
                className={`mobile-quick-chip ${onlyFavorites ? 'active-fav' : ''}`}
              >
                <Heart size={14} fill={onlyFavorites ? '#e11d48' : 'none'} color="#e11d48" />
                <span>Favoritos ({favoriteIds.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={sortByProximity ? handleClearLocation : handleGetLocation}
              disabled={locatingUser}
              className={`mobile-quick-chip ${sortByProximity ? 'active-loc' : ''}`}
            >
              <Navigation size={14} color={sortByProximity ? '#0284c7' : 'var(--primary-color)'} />
              <span>
                {locatingUser
                  ? 'Localizando...'
                  : sortByProximity
                  ? `${locationLabel || 'Cerca mío'} ✕`
                  : 'Cerca mío'}
              </span>
            </button>
            {!sortByProximity && (
              <button
                type="button"
                onClick={handleUseDemoLocation}
                className="mobile-quick-chip"
                title="Probar cercanía usando Centro CABA"
              >
                <MapPin size={13} color="#64748b" />
                <span>CABA Demo</span>
              </button>
            )}
          </div>

          {/* Mis Comercios Favoritos (Desktop Sidebar) */}
          {user && (
            <div className="desktop-only-fav-box" style={{ marginBottom: '1.15rem' }}>
              <button
                type="button"
                onClick={() => toggleOnlyFavoritesFilter()}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: onlyFavorites ? '1.5px solid #e11d48' : '1.5px solid #fecdd3',
                  background: onlyFavorites ? '#fff1f2' : '#ffffff',
                  color: onlyFavorites ? '#be123c' : '#e11d48',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: onlyFavorites ? '0 2px 8px rgba(225, 29, 72, 0.12)' : 'none',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                  <Heart size={15} fill={onlyFavorites ? '#e11d48' : 'none'} color="#e11d48" />
                  Mis Favoritos
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: onlyFavorites ? '#e11d48' : '#ffe4e6',
                  color: onlyFavorites ? '#ffffff' : '#be123c',
                }}>
                  {favoriteIds.length}
                </span>
              </button>
            </div>
          )}

          {/* Tu Ubicación y Cercanía */}
          <div className={`location-filter-box ${!sortByProximity ? 'hide-on-mobile-compact' : ''}`} style={{ marginBottom: '1.25rem' }}>
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
          {onlyFavorites && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 1rem',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '10px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#be123c',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <Heart size={14} fill="#e11d48" color="#e11d48" />
                Mostrando tus comercios seguidos / favoritos ({safeFiltered.length})
              </span>
              <button
                type="button"
                onClick={() => toggleOnlyFavoritesFilter(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#be123c',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.80rem',
                  textDecoration: 'underline',
                }}
              >
                Ver todos los comercios
              </button>
            </div>
          )}

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
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('Todos');
                  setSearchParams({});
                  setOnlyFavorites(false);
                  handleClearLocation();
                }}
                className="btn btn-outline-primary"
                style={{ marginTop: '1.25rem', fontSize: '0.85rem', padding: '7px 16px' }}
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            <>
              <div className="business-grid">
                {paginated.map(business => {
                  const isFav = favoriteIds.includes(business.id);
                  const rawSchedules = (business as any).schedules;
                  const bizSchedules = Array.isArray(rawSchedules) ? rawSchedules : [];
                  const jsDay = new Date().getDay();
                  const todayDayOfWeek = jsDay === 0 ? 7 : jsDay;
                  const opensToday = bizSchedules.some((s: any) => Number(s.dayOfWeek) === todayDayOfWeek);

                  return (
                  <Link
                      to={`/businesses/${business.id}`}
                      state={{ business }}
                      onClick={(e) => {
                        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                          e.preventDefault();
                          startSmoothNavigation(navigate, `/businesses/${business.id}`, { state: { business, from: location.pathname + location.search } });
                        }
                      }}
                      key={business.id}
                      style={{ textDecoration: 'none', display: 'block', width: '100%' }}
                    >
                    <div className="ml-card ml-card-hoverable ml-card-flush" style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
                      {/* Botón flotante de Favorito / Seguir en 1 clic */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(e, business.id)}
                        title={isFav ? 'Quitar de Mis Favoritos' : 'Seguir y guardar en Mis Favoritos'}
                        aria-label={isFav ? 'Quitar de Mis Favoritos' : 'Guardar en Mis Favoritos'}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          zIndex: 4,
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: isFav ? '#fff1f2' : 'rgba(255, 255, 255, 0.92)',
                          border: isFav ? '1.5px solid #fecdd3' : '1px solid rgba(226, 232, 240, 0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.14)',
                          transition: 'transform 0.15s ease, background 0.15s ease',
                        }}
                      >
                        <Heart
                          size={16}
                          fill={isFav ? '#e11d48' : 'none'}
                          color={isFav ? '#e11d48' : '#64748b'}
                        />
                      </button>

                      {/* Fondo por defecto de negocio con patrón de turnos y avatar */}
                      <DefaultBusinessCover name={business.name} size="card" />

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
                          {bizSchedules.length > 0 && (
                            opensToday ? (
                              <span style={{
                                fontSize: '0.71rem',
                                fontWeight: 700,
                                color: '#065f46',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                borderRadius: '12px',
                                padding: '1px 7px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                                Abre hoy
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '0.71rem',
                                fontWeight: 600,
                                color: '#64748b',
                                background: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '1px 7px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}>
                                Cerrado hoy
                              </span>
                            )
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
                        <span style={{ color: 'var(--primary-text)', fontWeight: 700, fontSize: '0.86rem' }}>Ver turnos →</span>
                      </div>
                    </div>
                  </Link>
                  );
                })}
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
