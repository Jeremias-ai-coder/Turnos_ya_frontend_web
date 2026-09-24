import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Clock, DollarSign, CalendarCheck, ArrowLeft, MapPin, Phone, Star } from 'lucide-react';

interface Business {
  id: number;
  name: string;
  address: string;
  phone: string;
  description: string;
  category: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}

const BusinessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, sRes] = await Promise.all([
          api.get(`/businesses/${id}`),
          api.get(`/businesses/${id}/services`)
        ]);
        setBusiness(bRes.data);
        setServices(sRes.data.data ?? sRes.data ?? []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }} className="text-muted">Cargando...</div>;
  if (!business) return <div>Negocio no encontrado.</div>;

  const initials = business.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div>
      <button onClick={() => navigate(-1)} className="btn btn-light" style={{ marginBottom: '1.25rem', fontSize: '0.88rem' }}>
        <ArrowLeft size={16} /> Volver al catálogo
      </button>

      {/* Header del negocio */}
      <div className="ml-card" style={{ marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #009ee3, #0081bb)', height: '100px' }} />
        <div style={{ padding: '0 2rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.25rem', marginTop: '-2.5rem', marginBottom: '1rem' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '16px',
              background: 'white', border: '3px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary-color)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ paddingBottom: '4px' }}>
              <h1 style={{ color: 'var(--text-title)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '2px' }}>{business.name}</h1>
              {business.category && <span className="badge badge-confirmed">{business.category}</span>}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--star-color)', fontWeight: 700, fontSize: '1.1rem', paddingBottom: '4px' }}>
              <Star size={18} fill="currentColor" /> 4.8
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {business.address && (
              <p className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="var(--primary-color)" /> {business.address}
              </p>
            )}
            {business.phone && (
              <p className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} color="var(--primary-color)" /> {business.phone}
              </p>
            )}
          </div>

          {business.description && (
            <p style={{ marginTop: '0.75rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{business.description}</p>
          )}
        </div>
      </div>

      <h2 style={{ color: 'var(--text-title)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
        Servicios Disponibles
      </h2>

      {services.length === 0 ? (
        <div className="empty-state">
          <p className="text-muted">Este local aún no tiene servicios publicados.</p>
        </div>
      ) : (
        <div className="services-grid">
          {services.map(svc => (
            <div key={svc.id} className="ml-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ color: 'var(--text-title)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                {svc.name}
              </h3>
              <p className="text-muted text-sm" style={{ marginBottom: '1rem', flexGrow: 1, lineHeight: 1.5 }}>
                {svc.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--background-app)', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                  <Clock size={15} color="var(--primary-color)" /> {svc.durationMinutes} min
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: 'var(--status-success-text)', fontSize: '1.05rem' }}>
                  <DollarSign size={15} />{svc.price}
                </div>
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate(`/businesses/${id}/book?serviceId=${svc.id}`)}
              >
                <CalendarCheck size={17} /> Reservar Turno
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessDetail;
