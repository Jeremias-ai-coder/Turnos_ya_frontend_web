import fs from 'fs';
import path from 'path';

// ============================================================================
// PROPOSAL 1: "AERO-FLOW" (Estela Aerodinámica Tapered + Silueta Pulida)
// Una flecha con cuerpo cónico que gana grosor con la aceleración.
// ============================================================================
function getProposal1(colorMode = 'white', width = 100, height = 100) {
  const isWhite = colorMode === 'white';
  const main = isWhite ? '#ffffff' : '#0f172a';
  const accent = isWhite ? '#ffffff' : '#009ee3';
  const bg = isWhite ? '#009ee3' : '#ffffff';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${width}" height="${height}" fill="none">
  <defs>
    <mask id="p1-mask-${colorMode}">
      <rect width="100" height="100" fill="#ffffff" />
      <!-- Cutout gap for arrow -->
      <path d="M6 94 C26 94 48 86 66 68 L74 58 L98 44 L88 22 L62 34 L64 48 C48 64 28 72 8 72 Z" fill="#000000" />
      <path d="M4 86 C24 86 48 80 66 64" stroke="#000000" stroke-width="20" stroke-linecap="round" />
    </mask>
  </defs>

  <!-- Loops -->
  <rect x="28" y="6" width="9" height="17" rx="4.5" fill="${main}" />
  <rect x="63" y="6" width="9" height="17" rx="4.5" fill="${main}" />

  <!-- Calendar Body Masked -->
  <g mask="url(#p1-mask-${colorMode})">
    <rect x="14" y="16" width="72" height="72" rx="17" stroke="${main}" stroke-width="6.5" />
    <path d="M16 33 C16 23 22 18 31 18 H69 C78 18 84 23 84 33 V36 H16 V33 Z" fill="${main}" />
    <!-- 3 Subtle date dots in header row -->
    <circle cx="32" cy="48" r="3.5" fill="${main}" opacity="0.75" />
    <circle cx="50" cy="48" r="3.5" fill="${main}" opacity="0.75" />
    <circle cx="68" cy="48" r="3.5" fill="${main}" opacity="0.75" />
    <circle cx="32" cy="62" r="3.5" fill="${main}" opacity="0.75" />
  </g>

  <!-- Speed Trails on Left (Wind Tunnel Style) -->
  <path d="M2 74h12M-2 82h15M3 90h11" stroke="${accent}" stroke-width="4.5" stroke-linecap="round" />

  <!-- Dynamic Tapered Arrow Ribbon (Solid filled geometry) -->
  <path d="M8 88 C24 88 46 82 64 66 C72 59 78 50 82 40 L70 36 L96 28 L88 56 L79 46 C75 54 70 61 62 68 C46 84 24 92 8 92 Z" fill="${accent}" />
</svg>`;
}

// ============================================================================
// PROPOSAL 2: "SONIC CUT" (Corte de Velocidad Supersónica / Swiss Style)
// Geometría diagonal precisa donde la flecha es una flecha de velocidad integrada.
// ============================================================================
function getProposal2(colorMode = 'white', width = 100, height = 100) {
  const isWhite = colorMode === 'white';
  const main = isWhite ? '#ffffff' : '#0f172a';
  const accent = isWhite ? '#ffffff' : '#009ee3';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${width}" height="${height}" fill="none">
  <defs>
    <mask id="p2-mask-${colorMode}">
      <rect width="100" height="100" fill="#ffffff" />
      <!-- Diagonal slice mask -->
      <path d="M-5 96 L58 48 L98 32 L86 16 L50 36 L-5 76 Z" fill="#000000" />
    </mask>
  </defs>

  <!-- Loops -->
  <rect x="28" y="7" width="9" height="16" rx="4.5" fill="${main}" />
  <rect x="63" y="7" width="9" height="16" rx="4.5" fill="${main}" />

  <!-- Calendar Body -->
  <g mask="url(#p2-mask-${colorMode})">
    <rect x="15" y="17" width="70" height="70" rx="16" stroke="${main}" stroke-width="6.5" />
    <path d="M17 33 C17 24 23 19 31 19 H69 C77 19 83 24 83 33 V36 H17 V33 Z" fill="${main}" />
    <!-- Day grid lines subtle -->
    <line x1="38" y1="44" x2="38" y2="76" stroke="${main}" stroke-width="3" opacity="0.4" />
    <line x1="62" y1="44" x2="62" y2="76" stroke="${main}" stroke-width="3" opacity="0.4" />
    <line x1="22" y1="54" x2="78" y2="54" stroke="${main}" stroke-width="3" opacity="0.4" />
    <line x1="22" y1="68" x2="78" y2="68" stroke="${main}" stroke-width="3" opacity="0.4" />
  </g>

  <!-- Speed Dash lines -->
  <line x1="2" y1="74" x2="16" y2="74" stroke="${accent}" stroke-width="4.5" stroke-linecap="round" />
  <line x1="-2" y1="82" x2="18" y2="82" stroke="${accent}" stroke-width="5" stroke-linecap="round" />
  <line x1="4" y1="90" x2="14" y2="90" stroke="${accent}" stroke-width="4.5" stroke-linecap="round" />

  <!-- The Sonic Arrow (Bold linear beam with angled arrowhead) -->
  <path d="M10 88 C30 88 54 78 72 58" stroke="${accent}" stroke-width="9" stroke-linecap="round" />
  <path d="M64 42 L96 32 L84 64 L76 52 Z" fill="${accent}" stroke="${accent}" stroke-width="2" stroke-linejoin="round" />
</svg>`;
}

// ============================================================================
// PROPOSAL 3: "TURBO BADGE" (Masa Sólida de Calendario + Relieve y Contraste)
// El calendario es una tarjeta compacta y sólida con un check-arrow de turno confirmado rápido.
// ============================================================================
function getProposal3(colorMode = 'white', width = 100, height = 100) {
  const isWhite = colorMode === 'white';
  const main = isWhite ? '#ffffff' : '#0f172a';
  const accent = isWhite ? '#ffffff' : '#009ee3';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${width}" height="${height}" fill="none">
  <!-- Rings -->
  <rect x="28" y="7" width="9" height="16" rx="4.5" fill="${main}" />
  <rect x="63" y="7" width="9" height="16" rx="4.5" fill="${main}" />

  <!-- Outer frame -->
  <rect x="15" y="17" width="70" height="70" rx="16" stroke="${main}" stroke-width="6" />

  <!-- Solid Header with clean notch -->
  <path d="M18 34 C18 24 24 19 32 19 H68 C76 19 82 24 82 34 V36 H18 V34 Z" fill="${main}" />

  <!-- Inner calendar dots -->
  <rect x="27" y="44" width="8" height="6" rx="3" fill="${main}" opacity="0.75" />
  <rect x="46" y="44" width="8" height="6" rx="3" fill="${main}" opacity="0.75" />
  <rect x="65" y="44" width="8" height="6" rx="3" fill="${main}" opacity="0.75" />
  <rect x="27" y="56" width="8" height="6" rx="3" fill="${main}" opacity="0.75" />

  <!-- Outer Speed Burst lines (3 staggered aerodynamic notches) -->
  <line x1="3" y1="72" x2="13" y2="72" stroke="${accent}" stroke-width="4.5" stroke-linecap="round" />
  <line x1="-1" y1="80" x2="16" y2="80" stroke="${accent}" stroke-width="5" stroke-linecap="round" />
  <line x1="5" y1="88" x2="12" y2="88" stroke="${accent}" stroke-width="4.5" stroke-linecap="round" />

  <!-- Big Bold Check-Arrow (Confirmed appointment instantly!) -->
  <path d="M22 66 L38 80 L88 34" stroke="${accent}" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Arrow wings on the tip -->
  <path d="M72 32 L94 28 L90 50" stroke="${accent}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;
}

// ============================================================================
// PROPOSAL 4: "HYPER-SPEED ORBIT" (El Cohete de Agilidad)
// Una reinterpretación ultra-moderna de la idea original:
// El calendario y la flecha forman una unidad cinética ininterrumpida.
// ============================================================================
function getProposal4(colorMode = 'white', width = 100, height = 100) {
  const isWhite = colorMode === 'white';
  const main = isWhite ? '#ffffff' : '#0f172a';
  const accent = isWhite ? '#ffffff' : '#009ee3';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${width}" height="${height}" fill="none">
  <defs>
    <mask id="p4-mask-${colorMode}">
      <rect width="100" height="100" fill="#ffffff" />
      <path d="M6 88 C24 88 46 80 62 64 C70 56 76 48 80 38" stroke="#000000" stroke-width="22" stroke-linecap="round" />
      <path d="M60 52 L98 40 L88 16 L54 32 Z" fill="#000000" />
    </mask>
  </defs>

  <!-- Rings -->
  <rect x="29" y="6" width="9" height="17" rx="4.5" fill="${main}" />
  <rect x="62" y="6" width="9" height="17" rx="4.5" fill="${main}" />

  <!-- Calendar with Mask -->
  <g mask="url(#p4-mask-${colorMode})">
    <rect x="14" y="16" width="72" height="72" rx="17" stroke="${main}" stroke-width="6.5" />
    <path d="M16 33 C16 23 22 18 31 18 H69 C78 18 84 23 84 33 V36 H16 V33 Z" fill="${main}" />
    
    <!-- Clean Minimal Grid (only 2 horizontal dividers) -->
    <line x1="20" y1="50" x2="80" y2="50" stroke="${main}" stroke-width="3.5" opacity="0.35" stroke-linecap="round" />
    <line x1="20" y1="66" x2="56" y2="66" stroke="${main}" stroke-width="3.5" opacity="0.35" stroke-linecap="round" />
    <circle cx="34" cy="50" r="3.5" fill="${main}" />
    <circle cx="50" cy="50" r="3.5" fill="${main}" />
    <circle cx="66" cy="50" r="3.5" fill="${main}" />
  </g>

  <!-- Speed Trails with Kinetic Graduation -->
  <line x1="1" y1="73" x2="13" y2="73" stroke="${accent}" stroke-width="4" stroke-linecap="round" />
  <line x1="-3" y1="81" x2="16" y2="81" stroke="${accent}" stroke-width="5" stroke-linecap="round" />
  <line x1="4" y1="89" x2="12" y2="89" stroke="${accent}" stroke-width="4" stroke-linecap="round" />

  <!-- The Hyper-Speed Arrow (Thick curving body + Precision aerodynamic arrowhead) -->
  <path d="M8 86 C26 86 48 80 66 64 C74 56 80 48 84 38" stroke="${accent}" stroke-width="10" stroke-linecap="round" />
  <!-- Sharp, Proud Arrowhead bursting freely -->
  <polygon points="66,35 97,26 88,57 78,44" fill="${accent}" stroke="${accent}" stroke-width="2.5" stroke-linejoin="round" />
</svg>`;
}

// Write proposals showcase HTML
const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Propuestas de Diseño - Isotipo Turnos Ya</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #f8fafc;
      color: #0f172a;
      padding: 3rem 2.5rem;
    }
    .header {
      margin-bottom: 2.5rem;
      text-align: center;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    h1 { font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; letter-spacing: -0.5px; }
    p.lead { font-size: 1rem; opacity: 0.92; line-height: 1.5; }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      border-radius: 20px;
      padding: 1.75rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .badge {
      display: inline-block;
      background: #009ee3;
      color: white;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 0.75rem;
    }
    .title {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
    }
    .desc {
      font-size: 0.88rem;
      opacity: 0.9;
      line-height: 1.45;
      margin-bottom: 1.5rem;
    }
    .preview-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .brand-preview {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      line-height: 1;
    }
    .brand-text {
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand-text span {
      font-weight: 900;
      margin-left: 2px;
    }
    .mobile-mock {
      background: #f1f5f9; border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 1.25rem;
    }
    .mobile-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .mobile-search {
      background: white;
      border-radius: 20px;
      padding: 6px 14px;
      color: #64748b; border: 1px solid #cbd5e1;
      font-size: 0.75rem;
    }
    .zoom-row {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      border-top: 1px solid #e2e8f0;
      padding-top: 1rem;
    }
    .zoom-label {
      font-size: 0.78rem;
      font-weight: 700;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>4 Propuestas de Isotipo de Alto Nivel para Turnos Ya</h1>
    <p class="lead">
      Diseñadas para transmitir <strong>organización de turnos</strong> (calendario claro e inconfundible), <strong>máxima velocidad</strong> (estelas de aceleración) y <strong>avance ascendente</strong> (flecha protagonista de alto impacto).
    </p>
  </div>

  <div class="grid">
    <!-- PROPUESTA 1 -->
    <div class="card">
      <div>
        <span class="badge">Propuesta 1</span>
        <div class="title">Aero-Flow (Flecha Cinta Cónica)</div>
        <div class="desc">
          La flecha es un <strong>polígono continuo que se ensancha</strong> a medida que acelera. Un corte limpio de 20px separa el calendario para que la flecha flote con volumen propio. Tres marcas de velocidad en el costado izquierdo marcan el impulso de despegue.
        </div>

        <div class="preview-row">
          <div class="brand-preview">
            ${getProposal1('color', 36, 36)}
            <span class="brand-text">Turnos<span>Ya</span></span>
          </div>
          <span style="font-size: 0.8rem; opacity: 0.8;">Navbar (36px)</span>
        </div>

        <div class="mobile-mock">
          <div class="mobile-top">
            <div class="brand-preview">
              ${getProposal1('color', 28, 28)}
              <span class="brand-text" style="font-size: 1.15rem;">Turnos<span>Ya</span></span>
            </div>
            <span style="font-size: 0.8rem;">🔔 👤</span>
          </div>
          <div class="mobile-search">Buscar negocios...</div>
        </div>
      </div>

      <div class="zoom-row">
        <span class="zoom-label">Detalle 70px:</span>
        ${getProposal1('color', 70, 70)}
      </div>
    </div>

    <!-- PROPUESTA 2 -->
    <div class="card">
      <div>
        <span class="badge">Propuesta 2</span>
        <div class="title">Sonic Cut (Corte de Precisión)</div>
        <div class="desc">
          Inspirada en el diseño suizo y tech contemporáneo. Una <strong>estela diagonal limpia</strong> divide dinámicamente el calendario, y la flecha emerge con una punta geométrica afilada que transmite eficiencia digital y velocidad supersónica.
        </div>

        <div class="preview-row">
          <div class="brand-preview">
            ${getProposal2('color', 36, 36)}
            <span class="brand-text">Turnos<span>Ya</span></span>
          </div>
          <span style="font-size: 0.8rem; opacity: 0.8;">Navbar (36px)</span>
        </div>

        <div class="mobile-mock">
          <div class="mobile-top">
            <div class="brand-preview">
              ${getProposal2('color', 28, 28)}
              <span class="brand-text" style="font-size: 1.15rem;">Turnos<span>Ya</span></span>
            </div>
            <span style="font-size: 0.8rem;">🔔 👤</span>
          </div>
          <div class="mobile-search">Buscar negocios...</div>
        </div>
      </div>

      <div class="zoom-row">
        <span class="zoom-label">Detalle 70px:</span>
        ${getProposal2('color', 70, 70)}
      </div>
    </div>

    <!-- PROPUESTA 3 -->
    <div class="card">
      <div>
        <span class="badge">Propuesta 3</span>
        <div class="title">Check-Arrow (Turno Confirmado Ya)</div>
        <div class="desc">
          Une los dos conceptos clave de la app: <strong>confirmar tu cita (el checkmark)</strong> y <strong>despegar al instante (la flecha rápida)</strong> en un solo trazo continuo y robusto. Las marcas de velocidad en el lomo izquierdo equilibran el balance horizontal.
        </div>

        <div class="preview-row">
          <div class="brand-preview">
            ${getProposal3('color', 36, 36)}
            <span class="brand-text">Turnos<span>Ya</span></span>
          </div>
          <span style="font-size: 0.8rem; opacity: 0.8;">Navbar (36px)</span>
        </div>

        <div class="mobile-mock">
          <div class="mobile-top">
            <div class="brand-preview">
              ${getProposal3('color', 28, 28)}
              <span class="brand-text" style="font-size: 1.15rem;">Turnos<span>Ya</span></span>
            </div>
            <span style="font-size: 0.8rem;">🔔 👤</span>
          </div>
          <div class="mobile-search">Buscar negocios...</div>
        </div>
      </div>

      <div class="zoom-row">
        <span class="zoom-label">Detalle 70px:</span>
        ${getProposal3('color', 70, 70)}
      </div>
    </div>

    <!-- PROPUESTA 4 -->
    <div class="card">
      <div>
        <span class="badge" style="background: #ffb800; color: #0f172a;">Propuesta 4 (Recomendada)</span>
        <div class="title">Hyper-Speed Orbit (Evolución Maestra)</div>
        <div class="desc">
          La <strong>evolución definitiva de tu concepto original</strong>: el calendario tiene cabecera sólida inconfundible y anillas nítidas. Una flecha curvada de 10px de espesor con punta aerodinámica rompe el marco hacia el éxito, con 3 estelas de aceleración cinética.
        </div>

        <div class="preview-row">
          <div class="brand-preview">
            ${getProposal4('color', 36, 36)}
            <span class="brand-text">Turnos<span>Ya</span></span>
          </div>
          <span style="font-size: 0.8rem; opacity: 0.8;">Navbar (36px)</span>
        </div>

        <div class="mobile-mock">
          <div class="mobile-top">
            <div class="brand-preview">
              ${getProposal4('color', 28, 28)}
              <span class="brand-text" style="font-size: 1.15rem;">Turnos<span>Ya</span></span>
            </div>
            <span style="font-size: 0.8rem;">🔔 👤</span>
          </div>
          <div class="mobile-search">Buscar negocios...</div>
        </div>
      </div>

      <div class="zoom-row">
        <span class="zoom-label">Detalle 70px:</span>
        ${getProposal4('color', 70, 70)}
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('Turnos_ya_frontend_web-main/public/proposals-showcase-light.html', html);
console.log('Proposals showcase created successfully!');
