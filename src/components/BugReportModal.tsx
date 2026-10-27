import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bug, X, CheckCircle2, AlertCircle, Send, LogIn, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeBugReportModal,
  closeBugReportModal,
  submitBugReportApi
} from '../services/bugReportService';

const SECTIONS = [
  'Buscador y Pantalla Principal',
  'Reservando un turno (Calendario / Horarios)',
  'Mis Turnos y Cancelaciones',
  'Mi Perfil y Seguridad (Contraseñas / 2FA / Sesiones)',
  'Panel de Negocio (Servicios / Horarios / Configuración)',
  'Notificaciones por Email / WhatsApp',
  'Inicio de sesión o Registro de cuenta',
  'Otro aspecto de la plataforma',
];

export const BugReportModal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [section, setSection] = useState('');
  const [summary, setSummary] = useState('');
  const [steps, setSteps] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeBugReportModal((open) => {
      setIsOpen(open);
      if (open) {
        setError(null);
        setSuccess(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleClose = () => {
    if (loading) return;
    closeBugReportModal();
  };

  const handleGoToLogin = () => {
    closeBugReportModal();
    navigate('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!section) {
      setError('Por favor seleccioná en qué sección o pantalla encontraste el error.');
      return;
    }
    if (!summary.trim()) {
      setError('Por favor escribí un breve resumen del error.');
      return;
    }
    if (!steps.trim()) {
      setError('Por favor describí los pasos para reproducir el error.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pageUrl = window.location.href;
      const deviceInfo = `${navigator.userAgent} (Resolución: ${window.innerWidth}x${window.innerHeight})`;

      await submitBugReportApi({
        section,
        summary: summary.trim(),
        steps: steps.trim(),
        pageUrl,
        deviceInfo,
      });

      setSuccess(true);
      setTimeout(() => {
        setSection('');
        setSummary('');
        setSteps('');
        setSuccess(false);
        closeBugReportModal();
      }, 2200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar el reporte. Por favor intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '100%' }}
      >
        <div className="modal-drag-handle" />

        {/* Cabecera del modal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bug size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                Reportar un error
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Tu reporte llegará directamente al equipo de soporte y desarrollo
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
            title="Cerrar"
            aria-label="Cerrar modal de reporte"
          >
            <X size={20} />
          </button>
        </div>

        {/* Si el usuario no está logueado: Aviso amigable */}
        {!user ? (
          <div style={{ textAlign: 'center', padding: '1rem 0 0.5rem' }}>
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '1.5rem 1.25rem',
                marginBottom: '1.5rem',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertCircle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '0.98rem', fontWeight: 700, color: '#92400e' }}>
                    Se requiere iniciar sesión
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: '#78350f', lineHeight: 1.5 }}>
                    Para poder enviar un ticket de soporte y que nuestro equipo técnico pueda dar seguimiento personalizado a tu caso, es necesario que inicies sesión con tu cuenta.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer-responsive">
              <button
                type="button"
                className="btn btn-light"
                onClick={handleClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGoToLogin}
              >
                <LogIn size={16} /> Iniciar sesión ahora
              </button>
            </div>
          </div>
        ) : success ? (
          /* Estado de éxito */
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h4 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-title)' }}>
              ¡Reporte enviado con éxito!
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
              Muchas gracias por ayudarnos a mejorar Turnos Ya. Nuestro equipo de soporte y tecnología analizará los pasos informados para resolverlo a la brevedad.
            </p>
          </div>
        ) : (
          /* Formulario fiel a la referencia */
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert-danger" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Campo 1: ¿Dónde te has encontrado el error? */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-title)', display: 'block', marginBottom: '6px' }}>
                ¿Dónde te has encontrado el error? <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                className="form-control"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                style={{
                  height: '46px',
                  borderRadius: '10px',
                  borderColor: '#cbd5e1',
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                required
              >
                <option value="" disabled>
                  Seleccioná la sección o pantalla...
                </option>
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo 2: Resúmenos en qué consistía el error */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-title)', display: 'block', marginBottom: '6px' }}>
                Resúmenos en qué consistía el error <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Al seleccionar las 17:00 hs no se habilita el botón de confirmar turno"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={255}
                style={{
                  height: '46px',
                  borderRadius: '10px',
                  borderColor: '#cbd5e1',
                  fontSize: '0.92rem',
                }}
                required
              />
            </div>

            {/* Campo 3: Pasos a seguir */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-title)', display: 'block', marginBottom: '6px' }}>
                Pasos a seguir <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Describí paso a paso qué hiciste antes del error:&#10;1. Fui a la página del comercio...&#10;2. Seleccioné el servicio X...&#10;3. Al hacer clic en reservar apareció el error..."
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                style={{
                  borderRadius: '10px',
                  borderColor: '#cbd5e1',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  padding: '10px 12px',
                  resize: 'vertical',
                }}
                required
              />
            </div>

            {/* Metadatos técnicos capturados automáticamente */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '10px 12px',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.78rem',
                color: '#64748b',
              }}
            >
              <Globe size={18} color="#009ee3" style={{ flexShrink: 0 }} />
              <div>
                Se adjuntará automáticamente tu usuario (<strong>{user.email}</strong>) y la pantalla actual para acelerar el diagnóstico del equipo técnico.
              </div>
            </div>

            <div className="modal-footer-responsive">
              <button
                type="button"
                className="btn btn-light"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ minWidth: '150px' }}
              >
                <Send size={15} /> {loading ? 'Enviando reporte...' : 'Enviar reporte'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
