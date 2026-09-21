import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

const CATEGORIES = ['Todos', 'Peluquería', 'Estética', 'Salud', 'Deportes', 'Otros'];


const Home: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filtered, setFiltered] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b?.name?.toLowerCase().includes(q) ||
        b?.category?.toLowerCase().includes(q) ||
        b?.address?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'Todos') {
      result = result.filter(b => b?.category === selectedCategory);
    }
    setFiltered(result);
    setPage(1);
  }, [searchQuery, selectedCategory, businesses]);

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
            <div className="filter-section-title" style={{ fontSize: '0.78rem' }}>Categoría</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: selectedCategory === cat ? 'var(--status-pending-bg)' : 'none',
                    border: '1px solid',
                    borderColor: selectedCategory === cat ? 'var(--primary-color)' : 'transparent',
                    color: selectedCategory === cat ? 'var(--primary-color)' : 'var(--text-main)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: selectedCategory === cat ? 700 : 500,
                    fontSize: '0.88rem',
                    fontFamily: 'var(--font-family-base)',
                    transition: 'all 0.15s',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Columna de negocios */}
        <div>
          {/* Barra de búsqueda y resultados */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h1 style={{ color: 'var(--text-title)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '2px' }}>
                {selectedCategory === 'Todos' ? 'Todos los negocios' : selectedCategory}
              </h1>
              {!loading && (
                <p className="text-muted text-sm">{safeFiltered.length} resultado{safeFiltered.length !== 1 ? 's' : ''} encontrado{safeFiltered.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '14px', minWidth: '220px' }}
              />
            </div>
          </div>

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
