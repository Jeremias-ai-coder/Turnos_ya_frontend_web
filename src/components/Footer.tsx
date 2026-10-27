import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Sparkles, HelpCircle, Store } from 'lucide-react';
import { openLegalModal } from '../services/legalModalService';

export const Footer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <footer className="ml-footer" role="contentinfo" aria-label="Pie de página institucional">
      {/* Botón Acordeón "Más información" idéntico a Mercado Libre */}
      <div className="ml-footer-accordion-container">
        <button
          type="button"
          className="ml-footer-accordion-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="ml-footer-extra-content"
        >
          <span>{isExpanded ? 'Menos información' : 'Más información'}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Contenido expandible del acordeón */}
      {isExpanded && (
        <div id="ml-footer-extra-content" className="ml-footer-expanded-box">
          <div className="container ml-footer-expanded-grid">
            <div className="ml-footer-col">
              <h4 className="ml-footer-col-title">
                <Sparkles size={16} color="#009ee3" /> Acerca de Turnos Ya
              </h4>
              <ul className="ml-footer-col-list">
                <li><a href="#/" onClick={(e) => { e.preventDefault(); openLegalModal('jobs'); }}>Quiénes somos</a></li>
                <li><a href="#/" onClick={(e) => { e.preventDefault(); openLegalModal('terms'); }}>Cómo funciona la plataforma</a></li>
                <li><a href="#/" onClick={(e) => { e.preventDefault(); openLegalModal('accessibility'); }}>Inclusión y accesibilidad digital</a></li>
                <li><a href="#/" onClick={(e) => { e.preventDefault(); openLegalModal('jobs'); }}>Sumate al equipo de desarrollo</a></li>
              </ul>
            </div>

            <div className="ml-footer-col">
              <h4 className="ml-footer-col-title">
                <Store size={16} color="#009ee3" /> Comercios y Profesionales
              </h4>
              <ul className="ml-footer-col-list">
                <li><a href="/dashboard">Publicar mi negocio</a></li>
                <li><a href="/dashboard">Gestión de agenda y turnos</a></li>
                <li><a href="#/" onClick={(e) => { e.preventDefault(); openLegalModal('terms'); }}>Condiciones para prestadores</a></li>
                <li><a href="/dashboard">Notificaciones automáticas por WhatsApp</a></li>
              </ul>
            </div>

            <div className="ml-footer-col">
              <h4 className="ml-footer-col-title">
                <Shield size={16} color="#00a650" /> Seguridad y Confianza
              </h4>
              <ul className="ml-footer-col-list">
                <li><a href="#/" onClick={(e) => { e.preventDefault(); openLegalModal('privacy'); }}>Protección de datos (Ley 25.326)</a></li>
                <li><a href="/profile?tab=security">Doble Factor de Autenticación (2FA)</a></li>
                <li><a href="/profile?tab=security&sub=devices">Control de sesiones remotas</a></li>
                <li><a href="#/" onClick={(e) => { e.preventDefault(); openLegalModal('cookies'); }}>Preferencias de cookies</a></li>
              </ul>
            </div>

            <div className="ml-footer-col">
              <h4 className="ml-footer-col-title">
                <HelpCircle size={16} color="#009ee3" /> Ayuda y Contacto
              </h4>
              <ul className="ml-footer-col-list">
                <li><a href="#/" onClick={(e) => { e.preventDefault(); openLegalModal('consumer'); }}>Defensa del Consumidor</a></li>
                <li><a href="mailto:soporte@turnosya.com">Atención al cliente: soporte@turnosya.com</a></li>
                <li><a href="#/" onClick={(e) => { e.preventDefault(); openLegalModal('terms'); }}>Política de cancelaciones</a></li>
                <li><a href="#/" onClick={(e) => { e.preventDefault(); openLegalModal('consumer'); }}>Libro de quejas online</a></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Barra principal de enlaces horizontales idéntica a Mercado Libre */}
      <div className="container ml-footer-links-wrap">
        <nav className="ml-footer-links" aria-label="Enlaces institucionales y legales">
          <button type="button" onClick={() => openLegalModal('jobs')}>Trabajá con nosotros</button>
          <button type="button" onClick={() => openLegalModal('terms')}>Términos y condiciones</button>
          <button type="button" onClick={() => openLegalModal('terms')}>Promociones</button>
          <button type="button" onClick={() => openLegalModal('privacy')}>Cómo cuidamos tu privacidad</button>
          <button type="button" onClick={() => openLegalModal('accessibility')}>Accesibilidad</button>
          <button type="button" onClick={() => openLegalModal('consumer')}>Información al usuario financiero</button>
          <button type="button" onClick={() => openLegalModal('consumer')}>Ayuda</button>
          <button type="button" onClick={() => openLegalModal('consumer')}>Defensa del Consumidor</button>
          <button type="button" onClick={() => openLegalModal('cookies')}>Configuración de cookies</button>
          <button type="button" onClick={() => openLegalModal('consumer')}>Libro de quejas online</button>
        </nav>

        {/* Información legal y copyright */}
        <div className="ml-footer-legal-copy">
          <p>
            Copyright © 2026 Turnos Ya - Todos los derechos reservados.
          </p>
          <p className="ml-footer-address">
            Av. Corrientes 1234, Piso 5, CABA, República Argentina. Plataforma tecnológica de reserva y gestión inteligente de turnos online.
          </p>
        </div>
      </div>
    </footer>
  );
};
