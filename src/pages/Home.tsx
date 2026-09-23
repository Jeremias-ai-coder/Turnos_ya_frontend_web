import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Building2, MapPin, SlidersHorizontal, Star } from 'lucide-react';
import { SkeletonCard } from '../components/common/SkeletonLoaders';
import { Pagination } from '../components/common/Pagination';

interface Business {
  id: number;
  name: string;
  address: string;
  phone: string;
  category: string;
  description?: string;
  rating?: number | null;
  reviewCount?: number;
}

const CATEGORIES = ['Todos', 'Peluquería', 'Estética', 'Salud', 'Deportes', 'Trámites', 'Mascotas', 'Otros'];

const normalizeText = (text: string = '') =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const Home: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filtered, setFiltered] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [page, setPage] = useState(1);
  const PER_PAGE = 9;

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
    fetchBusinesses();
  }, []);

  useEffect(() => {
    let result = Array.isArray(businesses) ? [...businesses] : [];
    if (searchQuery) {
      const q = normalizeText(searchQuery);
      result = result.filter(b =>
        normalizeText(b?.name).includes(q) ||
        normalizeText(b?.category).includes(q) ||
        normalizeText(b?.address).includes(q) ||
        normalizeText(b?.description).includes(q)
      );
    }
    if (selectedCategory !== 'Todos') {
      const normCat = normalizeText(selectedCategory);
      result = result.filter(b => normalizeText(b?.category) === normCat);
    }
    setFiltered(result);
    setPage(1);
  }, [searchQuery, selectedCategory, businesses]);

  const getCategoryCount = (cat: string) => {
    let list = Array.isArray(businesses) ? businesses : [];
    if (searchQuery) {
      const q = normalizeText(searchQuery);
      list = list.filter(b =>
        normalizeText(b?.name).includes(q) ||
        normalizeText(b?.category).includes(q) ||
        normalizeText(b?.address).includes(q) ||
        normalizeText(b?.description).includes(q)
      );
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
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="filter-section-title">
              <SlidersHorizontal size={15} /> Filtros
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div className="filter-section-title" style={{ fontSize: '0.78rem' }}>
              <MapPin size={13} color="var(--primary-color)" /> Tu Ubicación
            </div>
            <p className="text-muted text-xs" style={{ marginBottom: '0.75rem' }}>
              No se ha detectado tu ubicación actual.
            </p>
            <button className="btn btn-outline-primary btn-full" style={{ fontSize: '0.85rem', padding: '7px 12px', marginBottom: '6px' }}>
              Mi Ubicación
            </button>
          </div>

          <div className="divider" />

          <div>
            <div className="filter-section-title" style={{ fontSize: '0.78rem', marginBottom: '0.6rem' }}>Categoría</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {CATEGORIES.map(cat => {
                const count = getCategoryCount(cat);
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
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
        <div>
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
                  <Link to={`/businesses/${business.id}`} key={business.id} style={{ textDecoration: 'none' }}>
                    <div className="ml-card ml-card-hoverable" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                        {business.category && (
                          <span className="badge badge-confirmed" style={{ marginBottom: '6px', fontSize: '0.75rem', alignSelf: 'flex-start' }}>
                            {business.category}
                          </span>
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
