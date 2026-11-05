import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { startSmoothNavigation } from '../utils/transitionNavigator';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Building2,
  MapPin,
  Globe,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';


const InstagramIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const FacebookIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

interface CategoryItem {
  id: number;
  name: string;
  icon?: string;
  description?: string;
}

export const RegisterBusiness: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const editingBusiness = (location.state as any)?.business;

  const [step, setStep] = useState<number>(1);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [name, setName] = useState(editingBusiness?.name || '');
  const [categoryId, setCategoryId] = useState<number | ''>(editingBusiness?.categoryId || '');
  const [description, setDescription] = useState(editingBusiness?.description || '');
  const [address, setAddress] = useState(editingBusiness?.address || '');
  const [city, setCity] = useState(editingBusiness?.city || '');
  const [province, setProvince] = useState(editingBusiness?.province || 'Buenos Aires');
  const [phone, setPhone] = useState(editingBusiness?.phone || user?.phone || '');
  const [email, setEmail] = useState(editingBusiness?.email || user?.email || '');

  // Evidencias de veracidad y redes sociales
  const [instagramUrl, setInstagramUrl] = useState(editingBusiness?.instagramUrl || '');
  const [facebookUrl, setFacebookUrl] = useState(editingBusiness?.facebookUrl || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(editingBusiness?.googleMapsUrl || '');
  const [websiteUrl, setWebsiteUrl] = useState(editingBusiness?.websiteUrl || '');
  const [cuit, setCuit] = useState(editingBusiness?.cuit || '');

  // Pestaña de evidencia activa
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<'instagram' | 'facebook' | 'maps' | 'web' | 'cuit'>('instagram');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    api.get('/categories')
      .then((res: any) => {
        setCategories(res.data.data || res.data || []);
      })
      .catch((err: any) => {
        console.warn('Error cargando categorías:', err);
      })
      .finally(() => setLoadingCategories(false));
  }, []);

  // Helper para normalizar URL de Instagram
  const handleInstagramChange = (val: string) => {
    let clean = val.trim();
    if (clean.startsWith('@')) {
      clean = `https://instagram.com/${clean.substring(1)}`;
    } else if (clean && !clean.startsWith('http://') && !clean.startsWith('https://') && !clean.includes('instagram.com')) {
      clean = `https://instagram.com/${clean}`;
    }
    setInstagramUrl(clean);
  };

  // Helper para normalizar URL de Facebook
  const handleFacebookChange = (val: string) => {
    let clean = val.trim();
    if (clean && !clean.startsWith('http://') && !clean.startsWith('https://') && !clean.includes('facebook.com')) {
      clean = `https://facebook.com/${clean}`;
    }
    setFacebookUrl(clean);
  };

  // Validación por paso
  const canProceedStep1 = name.trim().length >= 2 && categoryId !== '';
  const canProceedStep2 = address.trim().length >= 3 && phone.trim().length >= 6;
  const hasAtLeastOneEvidence = Boolean(
    instagramUrl.trim() || facebookUrl.trim() || googleMapsUrl.trim() || websiteUrl.trim() || cuit.trim()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const payload = {
      name: name.trim(),
      categoryId: Number(categoryId),
      description: description.trim() || null,
      address: address.trim(),
      city: city.trim() || null,
      province: province.trim() || null,
      phone: phone.trim(),
      email: email.trim() || null,
      instagramUrl: instagramUrl.trim() || null,
      facebookUrl: facebookUrl.trim() || null,
      googleMapsUrl: googleMapsUrl.trim() || null,
      websiteUrl: websiteUrl.trim() || null,
      cuit: cuit.trim() || null,
    };

    try {
      if (editingBusiness?.id) {
        // Actualizar solicitud rechazada/existente
        await api.patch(`/businesses/${editingBusiness.id}`, payload);
      } else {
        // Crear nueva solicitud de alta
        await api.post('/businesses', payload);
      }
      startSmoothNavigation(navigate, '/dashboard', { state: { submittedNow: true } });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.detail || 'Error al enviar la solicitud.');
      setSubmitting(false);
    }
  };

  const selectedCategoryName = categories.find(c => c.id === Number(categoryId))?.name || 'Categoría no seleccionada';

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '1rem 0 3rem' }}>
      {/* Botón Volver */}
      <button
        type="button"
        onClick={() => {
          if (step > 1) {
            setStep(s => s - 1);
          } else {
            startSmoothNavigation(navigate, '/dashboard', { direction: 'backward' });
          }
        }}
        className="btn btn-light"
        style={{ marginBottom: '1.25rem', fontSize: '0.88rem' }}
      >
        <ArrowLeft size={16} /> {step > 1 ? 'Volver al paso anterior' : 'Volver a Mi Panel'}
      </button>

      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e0f2fe', color: '#0369a1', padding: '6px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          <ShieldCheck size={16} /> Verificación de Comercios Profesionales
        </div>
        <h1 style={{ fontWeight: 800, color: 'var(--text-title)', fontSize: '1.85rem', margin: '0 0 8px' }}>
          {editingBusiness ? 'Corregir y Reenviar Solicitud de Negocio' : 'Registrá tu Negocio en Turnos Ya'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '580px', margin: '0 auto' }}>
          Completá los datos de tu comercio y las evidencias de veracidad para que nuestro equipo valide tu alta comercial y active tu catálogo.
        </p>
      </div>

      {/* Stepper Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
        {[
          { num: 1, label: 'Identidad' },
          { num: 2, label: 'Ubicación y Contacto' },
          { num: 3, label: 'Evidencias y Redes' },
          { num: 4, label: 'Confirmación' }
        ].map((item, idx) => {
          const isActive = step === item.num;
          const isDone = step > item.num;
          return (
            <React.Fragment key={item.num}>
              {idx > 0 && (
                <div style={{ width: '40px', height: '2px', background: isDone ? 'var(--primary-color)' : '#e2e8f0', transition: 'background 0.3s' }} />
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isDone ? 'pointer' : 'default',
                  opacity: isActive || isDone ? 1 : 0.6
                }}
                onClick={() => isDone && setStep(item.num)}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isDone ? 'var(--primary-color)' : isActive ? '#e0f2fe' : '#f1f5f9',
                    color: isDone ? 'white' : isActive ? 'var(--primary-color)' : '#94a3b8',
                    border: isActive ? '2px solid var(--primary-color)' : 'none',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  {isDone ? '✓' : item.num}
                </div>
                <span style={{ fontSize: '0.84rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text-title)' : '#64748b' }}>
                  {item.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{errorMsg}</span>
        </div>
      )}

      {/* Main Card */}
      <div className="ml-card" style={{ padding: '2rem' }}>
        <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); setStep(s => s + 1); }}>

          {/* PASO 1: Identidad del Comercio */}
          {step === 1 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-title)' }}>
                    Paso 1: Identidad del Comercio
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                    Información básica que verán tus clientes en el catálogo.
                  </p>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Nombre Comercial del Negocio <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Barbería San Martín, Glow Estética..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                />
                <span className="text-muted text-xs">El nombre con el que te reconocen tus clientes.</span>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Categoría del Rubro <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {loadingCategories ? (
                  <LoadingSpinner size="sm" inline text="Cargando rubros disponibles..." />
                ) : (
                  <select
                    className="form-control"
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                    required
                  >
                    <option value="">Selecciona el rubro principal...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-muted text-xs">Ayuda a que tus clientes te encuentren filtrando por tu especialidad.</span>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Descripción y Presentación del Local
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Describe brevemente tus servicios, experiencia, comodidades del local (ej. café de cortesía, WiFi, estacionamiento)..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '0.95rem' }}
                >
                  Continuar a Ubicación y Contacto <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: Ubicación y Contacto */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-title)' }}>
                    Paso 2: Ubicación y Canales de Contacto
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                    Dónde se encuentra tu local y cómo pueden comunicarse tus clientes y la administración.
                  </p>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Dirección Comercial Completa <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Av. Santa Fe 1234, Local 4..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  required
                  autoFocus
                />
                <span className="text-muted text-xs">Incluye número, piso o local si corresponde.</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Ciudad / Localidad</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. CABA, Córdoba, Rosario..."
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Provincia / Región</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Buenos Aires, Santa Fe..."
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Teléfono / WhatsApp de Atención <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Ej. 11 4455-6677"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                  <span className="text-muted text-xs">Utilizado para enviar recordatorios y contacto.</span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Email del Comercio</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="contacto@tunegocio.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <span className="text-muted text-xs">Opcional si usas tu correo personal.</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setStep(1)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={16} /> Paso anterior
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!canProceedStep2}
                  onClick={() => setStep(3)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '0.95rem' }}
                >
                  Continuar a Evidencias <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Evidencias y Redes Sociales */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fdf2f8', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-title)' }}>
                    Paso 3: Botones de Evidencia y Veracidad
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                    Agregá al menos un enlace oficial para que el administrador verifique la autenticidad del negocio.
                  </p>
                </div>
              </div>

              {/* Botonera de Evidencias */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveEvidenceTab('instagram')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: activeEvidenceTab === 'instagram' ? '2px solid #e1306c' : '1px solid #e2e8f0',
                    background: activeEvidenceTab === 'instagram' ? '#fff1f2' : '#f8fafc',
                    color: activeEvidenceTab === 'instagram' ? '#e1306c' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <InstagramIcon size={17} /> Instagram {instagramUrl ? '✓' : ''}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEvidenceTab('facebook')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: activeEvidenceTab === 'facebook' ? '2px solid #1877f2' : '1px solid #e2e8f0',
                    background: activeEvidenceTab === 'facebook' ? '#eff6ff' : '#f8fafc',
                    color: activeEvidenceTab === 'facebook' ? '#1877f2' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <FacebookIcon size={17} /> Facebook {facebookUrl ? '✓' : ''}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEvidenceTab('maps')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: activeEvidenceTab === 'maps' ? '2px solid #ea4335' : '1px solid #e2e8f0',
                    background: activeEvidenceTab === 'maps' ? '#fef2f2' : '#f8fafc',
                    color: activeEvidenceTab === 'maps' ? '#ea4335' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <MapPin size={17} /> Google Maps {googleMapsUrl ? '✓' : ''}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEvidenceTab('web')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: activeEvidenceTab === 'web' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: activeEvidenceTab === 'web' ? '#e0f2fe' : '#f8fafc',
                    color: activeEvidenceTab === 'web' ? '#0284c7' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Globe size={17} /> Sitio Web {websiteUrl ? '✓' : ''}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEvidenceTab('cuit')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: activeEvidenceTab === 'cuit' ? '2px solid #475569' : '1px solid #e2e8f0',
                    background: activeEvidenceTab === 'cuit' ? '#f1f5f9' : '#f8fafc',
                    color: activeEvidenceTab === 'cuit' ? '#0f172a' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <ShieldCheck size={17} /> CUIT Fiscal {cuit ? '✓' : ''}
                </button>
              </div>

              {/* Contenedor del campo activo */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                {activeEvidenceTab === 'instagram' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <InstagramIcon size={18} color="#e1306c" /> Perfil de Instagram del Negocio
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="@tu_comercio o https://instagram.com/tu_comercio"
                        value={instagramUrl}
                        onChange={e => handleInstagramChange(e.target.value)}
                        autoFocus
                      />
                      {instagramUrl && (
                        <a
                          href={instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontSize: '0.84rem' }}
                        >
                          <ExternalLink size={15} /> Probar link
                        </a>
                      )}
                    </div>
                    <span className="text-muted text-xs" style={{ display: 'block', marginTop: '6px' }}>
                      Podes escribir @usuario o el enlace directo. El administrador comprobará publicaciones reales y actividad.
                    </span>
                  </div>
                )}

                {activeEvidenceTab === 'facebook' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FacebookIcon size={18} color="#1877f2" /> Página o Perfil de Facebook
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="https://facebook.com/tu_pagina"
                        value={facebookUrl}
                        onChange={e => handleFacebookChange(e.target.value)}
                        autoFocus
                      />
                      {facebookUrl && (
                        <a
                          href={facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontSize: '0.84rem' }}
                        >
                          <ExternalLink size={15} /> Probar link
                        </a>
                      )}
                    </div>
                    <span className="text-muted text-xs" style={{ display: 'block', marginTop: '6px' }}>
                      Enlace a tu fanpage oficial con opiniones o fotos del local.
                    </span>
                  </div>
                )}

                {activeEvidenceTab === 'maps' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={18} color="#ea4335" /> Ficha de Google Maps / Google My Business
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://maps.app.goo.gl/... o https://google.com/maps/..."
                        value={googleMapsUrl}
                        onChange={e => setGoogleMapsUrl(e.target.value)}
                        autoFocus
                      />
                      {googleMapsUrl && (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontSize: '0.84rem' }}
                        >
                          <ExternalLink size={15} /> Probar link
                        </a>
                      )}
                    </div>
                    <span className="text-muted text-xs" style={{ display: 'block', marginTop: '6px' }}>
                      Link de tu local físico en Google Maps. Es una de las evidencias más rápidas para verificar.
                    </span>
                  </div>
                )}

                {activeEvidenceTab === 'web' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Globe size={18} color="#0284c7" /> Sitio Web Oficial o Tienda Online
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://www.tunegocio.com"
                        value={websiteUrl}
                        onChange={e => setWebsiteUrl(e.target.value)}
                        autoFocus
                      />
                      {websiteUrl && (
                        <a
                          href={websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontSize: '0.84rem' }}
                        >
                          <ExternalLink size={15} /> Probar link
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {activeEvidenceTab === 'cuit' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={18} color="#475569" /> CUIT / Identificación Fiscal
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. 20-12345678-9"
                      value={cuit}
                      onChange={e => setCuit(e.target.value)}
                      autoFocus
                    />
                    <span className="text-muted text-xs" style={{ display: 'block', marginTop: '6px' }}>
                      Opcional. Permite acelerar la verificación para comercios formalmente constituidos.
                    </span>
                  </div>
                )}
              </div>

              {/* Resumen de evidencias cargadas */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} color="#16a34a" />
                <span style={{ fontSize: '0.88rem', color: '#166534', fontWeight: 600 }}>
                  {hasAtLeastOneEvidence
                    ? '¡Genial! Has proporcionado evidencias para que el administrador verifique tu negocio.'
                    : 'Por favor, completá al menos una red social o evidencia de contacto.'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setStep(2)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={16} /> Paso anterior
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!hasAtLeastOneEvidence}
                  onClick={() => setStep(4)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '0.95rem' }}
                >
                  Revisar y Confirmar <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: Resumen y Envío */}
          {step === 4 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-title)' }}>
                    Paso 4: Resumen de la Solicitud
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                    Revisa los datos antes de enviar la solicitud al administrador.
                  </p>
                </div>
              </div>

              {/* Ficha Resumen */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', background: '#ffffff', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.3rem' }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 2px', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-title)' }}>
                      {name}
                    </h4>
                    <span className="badge badge-confirmed" style={{ fontSize: '0.78rem' }}>
                      {selectedCategoryName}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', fontWeight: 700 }}>DIRECCIÓN</span>
                    <span style={{ color: 'var(--text-title)', fontWeight: 600 }}>{address}</span>
                    {city && <span style={{ color: '#64748b', display: 'block', fontSize: '0.82rem' }}>{city}, {province}</span>}
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', fontWeight: 700 }}>TELÉFONO / WHATSAPP</span>
                    <span style={{ color: 'var(--text-title)', fontWeight: 600 }}>{phone}</span>
                  </div>

                  {email && (
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', fontWeight: 700 }}>EMAIL COMERCIAL</span>
                      <span style={{ color: 'var(--text-title)', fontWeight: 600 }}>{email}</span>
                    </div>
                  )}
                </div>

                {description && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', fontWeight: 700 }}>DESCRIPCIÓN</span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#475569' }}>{description}</p>
                  </div>
                )}

                {/* Evidencias vinculadas */}
                <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>EVIDENCIAS ADJUNTADAS</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {instagramUrl && (
                      <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff1f2', color: '#e1306c', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                        <InstagramIcon size={14} /> Instagram <ExternalLink size={12} />
                      </a>
                    )}
                    {facebookUrl && (
                      <a href={facebookUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1877f2', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                        <FacebookIcon size={14} /> Facebook <ExternalLink size={12} />
                      </a>
                    )}
                    {googleMapsUrl && (
                      <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef2f2', color: '#ea4335', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                        <MapPin size={14} /> Google Maps <ExternalLink size={12} />
                      </a>
                    )}
                    {websiteUrl && (
                      <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                        <Globe size={14} /> Web <ExternalLink size={12} />
                      </a>
                    )}
                    {cuit && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                        <ShieldCheck size={14} /> CUIT: {cuit}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Informative alert */}
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '14px 16px', marginBottom: '1.5rem', display: 'flex', gap: '10px' }}>
                <Info size={20} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.86rem', color: '#0369a1' }}>
                  <strong>Proceso de Aprobación por Administración:</strong>
                  <br />
                  Al enviar la solicitud, el comercio ingresará en estado de <strong>Revisión</strong>. Un administrador verificará las evidencias para garantizar la veracidad de los datos. En un plazo habitual de 12 a 24 horas hábiles recibirás la confirmación.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={submitting}
                  onClick={() => setStep(3)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={16} /> Modificar evidencias
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '1rem', fontWeight: 800 }}
                >
                  {submitting ? (
                    <LoadingSpinner size="sm" inline text="Enviando solicitud al administrador..." color="white" />
                  ) : (
                    <>✓ {editingBusiness ? 'Reenviar Solicitud a Revisión' : 'Enviar Solicitud de Alta'}</>
                  )}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default RegisterBusiness;
