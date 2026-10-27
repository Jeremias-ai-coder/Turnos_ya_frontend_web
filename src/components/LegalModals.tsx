import React, { useEffect, useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Cookie,
  Scale,
  Eye,
  CheckCircle2,
  X,
  Briefcase
} from 'lucide-react';
import type { LegalModalType } from '../services/legalModalService';
import {
  subscribeLegalModal,
  closeLegalModal,
  getStoredCookiePreferences,
  saveCookiePreferences
} from '../services/legalModalService';

export const LegalModals: React.FC = () => {
  const [activeModal, setActiveModal] = useState<LegalModalType | null>(null);

  // Estados para configuración de cookies
  const [cookieState, setCookieState] = useState<{
    analytics: boolean;
    preferences: boolean;
  }>({
    analytics: true,
    preferences: true,
  });
  const [cookiesSavedToast, setCookiesSavedToast] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeLegalModal((type) => {
      setActiveModal(type);
      if (type === 'cookies') {
        const stored = getStoredCookiePreferences();
        if (stored) {
          setCookieState({
            analytics: stored.analytics,
            preferences: stored.preferences,
          });
        }
      }
    });
    return unsubscribe;
  }, []);

  const handleSaveCookiePreferences = () => {
    saveCookiePreferences({
      analytics: cookieState.analytics,
      preferences: cookieState.preferences,
    });
    setCookiesSavedToast(true);
    setTimeout(() => {
      setCookiesSavedToast(false);
      closeLegalModal();
    }, 900);
  };

  const handleAcceptAllCookies = () => {
    saveCookiePreferences({
      analytics: true,
      preferences: true,
    });
    setCookiesSavedToast(true);
    setTimeout(() => {
      setCookiesSavedToast(false);
      closeLegalModal();
    }, 900);
  };

  if (!activeModal) return null;

  return (
    <div className="modal-overlay" onClick={closeLegalModal}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: activeModal === 'cookies' ? '560px' : '680px',
          width: '100%',
        }}
      >
        <div className="modal-drag-handle" />

        {/* ========================================================= */}
        {/* MODAL 1: TÉRMINOS Y CONDICIONES */}
        {/* ========================================================= */}
        {activeModal === 'terms' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 158, 227, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Términos y Condiciones Generales
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Última actualización: Octubre 2026 · Turnos Ya Argentina
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeLegalModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                title="Cerrar"
                aria-label="Cerrar modal de términos y condiciones"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="legal-modal-body"
              style={{
                maxHeight: '55vh',
                overflowY: 'auto',
                paddingRight: '6px',
                fontSize: '0.88rem',
                color: 'var(--text-main)',
                lineHeight: 1.6,
              }}
            >
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '1.25rem' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>
                  Bienvenido a <strong>Turnos Ya</strong>. Al utilizar nuestra plataforma web y aplicación móvil, aceptás de manera plena los presentes Términos y Condiciones que rigen la relación entre las personas usuarias, los comercios y Turnos Ya S.R.L.
                </p>
              </div>

              <h4 style={{ margin: '1rem 0 0.4rem', color: 'var(--text-title)', fontSize: '0.98rem', fontWeight: 700 }}>
                1. Naturaleza del Servicio
              </h4>
              <p>
                Turnos Ya es una solución de software como servicio (SaaS) que proporciona infraestructura tecnológica para que profesionales, clínicas, salones de belleza y comercios publiquen sus agendas y permitan a clientes reservar, reprogramar o cancelar turnos en tiempo real.
              </p>

              <h4 style={{ margin: '1rem 0 0.4rem', color: 'var(--text-title)', fontSize: '0.98rem', fontWeight: 700 }}>
                2. Capacidad Legal y Registro de Cuentas
              </h4>
              <p>
                Para utilizar el servicio de reservas es necesario ser mayor de 18 años o contar con autorización de tutores legales. Las personas usuarias se comprometen a suministrar datos verdaderos, exactos y actualizados (nombre, correo electrónico y teléfono). Cada cuenta es personal e intransferible.
              </p>

              <h4 style={{ margin: '1rem 0 0.4rem', color: 'var(--text-title)', fontSize: '0.98rem', fontWeight: 700 }}>
                3. Compromiso de Asistencia y Política de Cancelaciones
              </h4>
              <p>
                La confirmación de un turno genera un compromiso de asistencia entre el cliente y el comercio. En caso de no poder concurrir, la persona usuaria se compromete a cancelar o reprogramar el turno con una antelación mínima razonable (sugerida de al menos 2 horas) a través del apartado "Mis Turnos" para liberar el cupo.
              </p>

              <h4 style={{ margin: '1rem 0 0.4rem', color: 'var(--text-title)', fontSize: '0.98rem', fontWeight: 700 }}>
                4. Responsabilidad sobre la Prestación del Servicio
              </h4>
              <p>
                Turnos Ya actúa exclusivamente como canal tecnológico facilitador de la agenda. La prestación efectiva de los servicios presenciales (médicos, estéticos, técnicos, etc.), su calidad, idoneidad, puntualidad y precios son de exclusiva responsabilidad del comercio o profesional prestador.
              </p>

              <h4 style={{ margin: '1rem 0 0.4rem', color: 'var(--text-title)', fontSize: '0.98rem', fontWeight: 700 }}>
                5. Seguridad de las Credenciales
              </h4>
              <p>
                El usuario es responsable de resguardar su contraseña y métodos de doble factor de autenticación (2FA). Turnos Ya cuenta con cifrado AES-256 y hashing seguro para proteger los accesos, y permite revocar sesiones remotas en cualquier momento desde el panel de perfil.
              </p>

              <h4 style={{ margin: '1rem 0 0.4rem', color: 'var(--text-title)', fontSize: '0.98rem', fontWeight: 700 }}>
                6. Legislación y Jurisdicción
              </h4>
              <p>
                Estos términos se rigen por las leyes vigentes de la República Argentina. Ante cualquier controversia, las partes se someten a la competencia de los Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires, con renuncia a cualquier otro fuero.
              </p>
            </div>

            <div className="modal-footer-responsive">
              <button
                type="button"
                className="btn btn-primary"
                onClick={closeLegalModal}
                style={{ minWidth: '130px' }}
              >
                Entendido y de acuerdo
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 2: CÓMO CUIDAMOS TU PRIVACIDAD (LEY 25.326) */}
        {/* ========================================================= */}
        {activeModal === 'privacy' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 166, 80, 0.1)', color: '#00a650', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Cómo cuidamos tu privacidad
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                    Conforme a la Ley Nacional 25.326 de Protección de Datos Personales
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeLegalModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                title="Cerrar"
                aria-label="Cerrar modal de privacidad"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="legal-modal-body"
              style={{
                maxHeight: '55vh',
                overflowY: 'auto',
                paddingRight: '6px',
                fontSize: '0.88rem',
                color: 'var(--text-main)',
                lineHeight: 1.6,
              }}
            >
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px', marginBottom: '1.25rem' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d' }}>
                  🔒 <strong>Tu privacidad es sagrada:</strong> En Turnos Ya no comercializamos tus datos personales. La información que proporcionás se utiliza exclusivamente para coordinar tus turnos y brindarte un servicio seguro y ágil.
                </p>
              </div>

              <h4 style={{ margin: '1rem 0 0.4rem', color: 'var(--text-title)', fontSize: '0.98rem', fontWeight: 700 }}>
                1. Datos Recopilados y Finalidad
              </h4>
              <p>
                Recolectamos nombre completo, dirección de correo electrónico, número de teléfono y datos asociados a tus reservas (servicio solicitado, fecha y horario). Estos datos tienen la única finalidad de confirmar tus citas, enviarte recordatorios útiles por email o WhatsApp y permitir la identificación fehaciente ante el comercio.
              </p>

              <h4 style={{ margin: '1rem 0 0.4rem', color: 'var(--text-title)', fontSize: '0.98rem', fontWeight: 700 }}>
                2. Medidas de Seguridad y Criptografía
              </h4>
              <p>
                Implementamos estándares de ciberseguridad líderes en la industria:
              </p>
              <ul style={{ paddingLeft: '1.25rem', margin: '0.4rem 0 0.8rem' }}>
                <li>Cifrado simétrico AES-256 en reposo para secretos de autenticación 2FA.</li>
                <li>Hashing criptográfico irreversible bcrypt con salts aleatorios para todas las contraseñas.</li>
                <li>Comunicaciones seguras mediante protocolo HTTPS con certificados TLS vigentes.</li>
                <li>Control y cierre remoto de sesiones activas en cualquier dispositivo sospechoso.</li>
              </ul>

              <h4 style={{ margin: '1rem 0 0.4rem', color: 'var(--text-title)', fontSize: '0.98rem', fontWeight: 700 }}>
                3. Derechos ARCO (Acceso, Rectificación, Actualización y Supresión)
              </h4>
              <p>
                Conforme al Art. 14 de la Ley 25.326, tenés derecho a acceder en forma gratuita a tus datos personales en intervalos no inferiores a 6 meses. Podés modificar tus datos o solicitar la baja integral de tu cuenta en cualquier momento desde la sección <em>Mi Perfil &gt; Cancelar Cuenta</em> o escribiéndonos a <strong>privacidad@turnosya.com</strong>.
              </p>

              <h4 style={{ margin: '1rem 0 0.4rem', color: 'var(--text-title)', fontSize: '0.98rem', fontWeight: 700 }}>
                4. Autoridad de Control
              </h4>
              <p>
                La Agencia de Acceso a la Información Pública (AAIP), Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.
              </p>
            </div>

            <div className="modal-footer-responsive">
              <button
                type="button"
                className="btn btn-primary"
                onClick={closeLegalModal}
                style={{ minWidth: '130px' }}
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 3: CONFIGURACIÓN DE COOKIES */}
        {/* ========================================================= */}
        {activeModal === 'cookies' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 158, 227, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Cookie size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Centro de Preferencias de Cookies
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Gestioná cómo y cuándo utilizamos tecnologías de almacenamiento local
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeLegalModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                title="Cerrar"
                aria-label="Cerrar modal de cookies"
              >
                <X size={20} />
              </button>
            </div>

            {cookiesSavedToast && (
              <div className="alert-success" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> ¡Tus preferencias de cookies fueron guardadas exitosamente!
              </div>
            )}

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
              Las cookies y elementos de almacenamiento local nos permiten ofrecerte una navegación fluida, recordar tus sesiones abiertas y garantizar la seguridad de tus transacciones y reservas.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {/* 1. Cookies Técnicas y Esenciales (Obligatorias) */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem 1.15rem',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-title)' }}>
                      Cookies Técnicas y Esenciales
                    </h4>
                    <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                      Siempre activas
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.81rem', color: '#64748b', lineHeight: 1.45 }}>
                    Son estrictamente necesarias para el funcionamiento de la web: mantienen tu sesión segura, autentican tokens JWT y previenen ataques de falsificación entre sitios (CSRF).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  style={{ width: '18px', height: '18px', marginTop: '3px', cursor: 'not-allowed', accentColor: '#009ee3' }}
                />
              </div>

              {/* 2. Cookies de Análisis y Rendimiento */}
              <label
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem 1.15rem',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-title)' }}>
                    Cookies de Análisis y Rendimiento
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.81rem', color: '#64748b', lineHeight: 1.45 }}>
                    Nos ayudan a entender de forma estadística y anónima cómo interactúan los usuarios con la plataforma para optimizar la velocidad y corregir errores de navegación.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={cookieState.analytics}
                  onChange={(e) => setCookieState((prev) => ({ ...prev, analytics: e.target.checked }))}
                  style={{ width: '18px', height: '18px', marginTop: '3px', cursor: 'pointer', accentColor: '#009ee3' }}
                />
              </label>

              {/* 3. Cookies de Personalización y Preferencias */}
              <label
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem 1.15rem',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-title)' }}>
                    Cookies de Funcionalidad y Preferencias
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.81rem', color: '#64748b', lineHeight: 1.45 }}>
                    Permiten recordar tus filtros recientes, comercios favoritos y preferencias de visualización para que no tengas que reconfigurarlos en cada visita.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={cookieState.preferences}
                  onChange={(e) => setCookieState((prev) => ({ ...prev, preferences: e.target.checked }))}
                  style={{ width: '18px', height: '18px', marginTop: '3px', cursor: 'pointer', accentColor: '#009ee3' }}
                />
              </label>
            </div>

            <div className="modal-footer-responsive" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-light"
                onClick={handleAcceptAllCookies}
              >
                Aceptar todas
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveCookiePreferences}
              >
                Guardar preferencias
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 4: DEFENSA DEL CONSUMIDOR */}
        {/* ========================================================= */}
        {activeModal === 'consumer' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Scale size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Defensa de las y los Consumidores
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Ley Nacional N° 24.240 y Resoluciones de la Secretaría de Comercio
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeLegalModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                title="Cerrar"
                aria-label="Cerrar modal de defensa del consumidor"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              <p>
                En <strong>Turnos Ya</strong> promovemos relaciones de consumo transparentes, justas y de total confianza, en conformidad con la Ley 24.240 y las resoluciones de la Dirección Nacional de Defensa del Consumidor y Arbitraje del Consumo.
              </p>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', margin: '1rem 0' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-title)' }}>
                  ¿Tuviste algún inconveniente o querés hacer una consulta?
                </h4>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#475569' }}>
                  Podés contactar a nuestro equipo de soporte y atención directa escribiendo a <strong>soporte@turnosya.com</strong>. Respondemos todas las consultas en menos de 24 horas hábiles.
                </p>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Para reclamos formales en el ámbito de la República Argentina, también podés dirigirte a la Dirección Nacional de Defensa del Consumidor a través del portal oficial <strong>www.argentina.gob.ar/produccion/defensadelconsumidor</strong> o llamar a la línea gratuita <strong>0800-666-1518</strong>.
              </p>
            </div>

            <div className="modal-footer-responsive">
              <button
                type="button"
                className="btn btn-primary"
                onClick={closeLegalModal}
                style={{ minWidth: '130px' }}
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 5: ACCESIBILIDAD WEB */}
        {/* ========================================================= */}
        {activeModal === 'accessibility' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 158, 227, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Eye size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Declaración de Accesibilidad
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Compromiso de inclusión digital y estándares WCAG 2.1 AA
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeLegalModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                title="Cerrar"
                aria-label="Cerrar modal de accesibilidad"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              <p>
                En <strong>Turnos Ya</strong> estamos comprometidos con garantizar que nuestra plataforma digital sea accesible para todas las personas, independientemente de sus capacidades técnicas, visuales o motrices.
              </p>

              <ul style={{ paddingLeft: '1.25rem', margin: '0.75rem 0' }}>
                <li>Contraste tipográfico armónico y legible según estándares internacionales.</li>
                <li>Navegación completa asistida por teclado para usuarios que prescindan de mouse.</li>
                <li>Etiquetas ARIA y semántica HTML5 estricta para lectores de pantalla.</li>
                <li>Diseño responsive con zonas táctiles amplias (mínimo 44px de altura) en dispositivos móviles.</li>
              </ul>

              <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '1rem' }}>
                Si experimentás alguna dificultad de accesibilidad en cualquier sección de la web, por favor avisanos a <strong>accesibilidad@turnosya.com</strong> para que podamos resolverla a la brevedad.
              </p>
            </div>

            <div className="modal-footer-responsive">
              <button
                type="button"
                className="btn btn-primary"
                onClick={closeLegalModal}
                style={{ minWidth: '130px' }}
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 6: TRABAJÁ CON NOSOTROS */}
        {/* ========================================================= */}
        {activeModal === 'jobs' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 158, 227, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Briefcase size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Sumate al Equipo de Turnos Ya
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Transformando la gestión de turnos y agendas en toda Argentina
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeLegalModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                title="Cerrar"
                aria-label="Cerrar modal de empleos"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              <p>
                Buscamos talentos apasionados por la tecnología, el diseño de producto y la atención al cliente para acelerar la digitalización de comercios y profesionales independientes.
              </p>

              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '14px', margin: '1rem 0' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.92rem', fontWeight: 700, color: '#0369a1' }}>
                  Perfiles frecuentes:
                </h4>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#0c4a6e' }}>
                  Desarrolladores Fullstack (TypeScript / React / Node.js / React Native), Diseñadores UI/UX, Especialistas en Seguridad y Soporte Comercial.
                </p>
              </div>

              <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Envianos tu CV o portfolio a <strong>talento@turnosya.com</strong> indicando tu especialidad y te tendremos en cuenta para nuestras próximas búsquedas.
              </p>
            </div>

            <div className="modal-footer-responsive">
              <button
                type="button"
                className="btn btn-primary"
                onClick={closeLegalModal}
                style={{ minWidth: '130px' }}
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
