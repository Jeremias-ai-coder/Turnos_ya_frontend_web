import fs from 'fs';
import path from 'path';

// Helper to draw a true symmetrical arrowhead pointing along angle theta
// Center of arrow base at (bx, by), tip at (tx, ty), wing width w, wing length l
// At 45 degrees:
// Tip: (tx, ty)
// Direction unit vector: u = (1/sqrt(2), -1/sqrt(2)) = (0.7071, -0.7071)
// Perpendicular unit vector: v = (0.7071, 0.7071)

// ============================================================================
// VARIATION 3A: "DELTA CHECK"
// Checkmark con flecha Delta de alta precisión (punta triangular nítida y simétrica a 45°)
// ============================================================================
function getVar3A(colorMode = 'white', width = 100, height = 100) {
  const isWhite = colorMode === 'white';
  const stroke = isWhite ? '#ffffff' : '#0f172a';
  const fill = isWhite ? '#ffffff' : '#009ee3';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${width}" height="${height}" fill="none">
  <defs>
    <mask id="mask-3a-${colorMode}">
      <rect width="100" height="100" fill="#ffffff" />
      <!-- Cutout gap where checkmark & arrow pass through the calendar frame -->
      <path d="M16 68 L36 88 L86 38" stroke="#000000" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
      <polygon points="66,42 98,24 80,56" fill="#000000" />
      <circle cx="82" cy="38" r="14" fill="#000000" />
    </mask>
  </defs>

  <!-- Top Rings -->
  <rect x="27" y="6" width="9" height="17" rx="4.5" fill="${stroke}" />
  <rect x="64" y="6" width="9" height="17" rx="4.5" fill="${stroke}" />

  <!-- Calendar Outer Frame with Mask -->
  <g mask="url(#mask-3a-${colorMode})">
    <rect x="14" y="16" width="72" height="72" rx="17" stroke="${stroke}" stroke-width="6.5" />
    <path d="M16 33 C16 23 22 18 31 18 H69 C78 18 84 23 84 33 V36 H16 V32 Z" fill="${stroke}" />
    <!-- 3 subtle date indicator dots in top row -->
    <circle cx="32" cy="48" r="3.5" fill="${stroke}" opacity="0.7" />
    <circle cx="50" cy="48" r="3.5" fill="${stroke}" opacity="0.7" />
    <circle cx="68" cy="48" r="3.5" fill="${stroke}" opacity="0.7" />
  </g>

  <!-- Speed Trails on Left (Originating behind the checkmark) -->
  <line x1="2" y1="64" x2="14" y2="64" stroke="${fill}" stroke-width="4.5" stroke-linecap="round" />
  <line x1="-2" y1="72" x2="16" y2="72" stroke="${fill}" stroke-width="5" stroke-linecap="round" />
  <line x1="4" y1="80" x2="13" y2="80" stroke="${fill}" stroke-width="4.5" stroke-linecap="round" />

  <!-- THE CHECK-ARROW: Checkmark stem -->
  <path d="M22 64 L38 80 L76 42" stroke="${fill}" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round" />

  <!-- THE DELTA ARROWHEAD: Solid, symmetrical, razor-sharp along 45° axis -->
  <!-- Tip at (94, 24), Back-left at (68, 32), Notch at (76, 42), Back-right at (86, 50) -->
  <polygon points="94,24 68,32 75,41 86,50" fill="${fill}" stroke="${fill}" stroke-width="2" stroke-linejoin="round" />
</svg>`;
}

// ============================================================================
// VARIATION 3B: "STEALTH WING CHECK"
// Punta de flecha clásica audaz con alas pronunciadas, perfectamente visible a cualquier distancia
// ============================================================================
function getVar3B(colorMode = 'white', width = 100, height = 100) {
  const isWhite = colorMode === 'white';
  const stroke = isWhite ? '#ffffff' : '#0f172a';
  const fill = isWhite ? '#ffffff' : '#009ee3';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${width}" height="${height}" fill="none">
  <defs>
    <mask id="mask-3b-${colorMode}">
      <rect width="100" height="100" fill="#ffffff" />
      <path d="M18 64 L38 82 L76 44" stroke="#000000" stroke-width="19" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="82" cy="36" r="16" fill="#000000" />
    </mask>
  </defs>

  <!-- Top Rings -->
  <rect x="27" y="6" width="9" height="17" rx="4.5" fill="${stroke}" />
  <rect x="64" y="6" width="9" height="17" rx="4.5" fill="${stroke}" />

  <!-- Calendar Body -->
  <g mask="url(#mask-3b-${colorMode})">
    <rect x="14" y="16" width="72" height="72" rx="17" stroke="${stroke}" stroke-width="6.5" />
    <path d="M16 33 C16 23 22 18 31 18 H69 C78 18 84 23 84 33 V36 H16 V32 Z" fill="${stroke}" />
    <!-- Clean date grid dots -->
    <rect x="28" y="45" width="8" height="6" rx="3" fill="${stroke}" opacity="0.65" />
    <rect x="47" y="45" width="8" height="6" rx="3" fill="${stroke}" opacity="0.65" />
    <rect x="66" y="45" width="8" height="6" rx="3" fill="${stroke}" opacity="0.65" />
  </g>

  <!-- Speed Lines -->
  <line x1="1" y1="66" x2="13" y2="66" stroke="${fill}" stroke-width="4.5" stroke-linecap="round" />
  <line x1="-3" y1="74" x2="16" y2="74" stroke="${fill}" stroke-width="5" stroke-linecap="round" />
  <line x1="3" y1="82" x2="12" y2="82" stroke="${fill}" stroke-width="4.5" stroke-linecap="round" />

  <!-- Checkmark Stem (Starts at 22,62, down to 38,78, up to 74,42) -->
  <path d="M22 62 L38 78 L74 42" stroke="${fill}" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round" />

  <!-- PROMINENT SOLID ARROWHEAD: Big isosceles triangle pointing at 45° -->
  <!-- Tip: (95, 21). Left wing: (67, 33). Right wing: (83, 49). Base center: (75, 41) -->
  <polygon points="95,21 66,34 74,42 82,50" fill="${fill}" stroke="${fill}" stroke-width="2" stroke-linejoin="round" />
</svg>`;
}

// ============================================================================
// VARIATION 3C: "DYNAMIC SWOOSH-CHECK" (Curva Cinemática Orgánica)
// En lugar de una 'V' angulosa, el checkmark tiene una transición curvada y fluida
// ============================================================================
function getVar3C(colorMode = 'white', width = 100, height = 100) {
  const isWhite = colorMode === 'white';
  const stroke = isWhite ? '#ffffff' : '#0f172a';
  const fill = isWhite ? '#ffffff' : '#009ee3';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${width}" height="${height}" fill="none">
  <defs>
    <mask id="mask-3c-${colorMode}">
      <rect width="100" height="100" fill="#ffffff" />
      <path d="M18 64 Q32 86 44 80 L80 44" stroke="#000000" stroke-width="19" stroke-linecap="round" />
      <circle cx="84" cy="34" r="16" fill="#000000" />
    </mask>
  </defs>

  <!-- Loops -->
  <rect x="27" y="6" width="9" height="17" rx="4.5" fill="${stroke}" />
  <rect x="64" y="6" width="9" height="17" rx="4.5" fill="${stroke}" />

  <!-- Calendar Frame -->
  <g mask="url(#mask-3c-${colorMode})">
    <rect x="14" y="16" width="72" height="72" rx="17" stroke="${stroke}" stroke-width="6.5" />
    <path d="M16 33 C16 23 22 18 31 18 H69 C78 18 84 23 84 33 V36 H16 V32 Z" fill="${stroke}" />
    <!-- 3 subtle date indicator dots -->
    <circle cx="32" cy="47" r="3.5" fill="${stroke}" opacity="0.75" />
    <circle cx="50" cy="47" r="3.5" fill="${stroke}" opacity="0.75" />
    <circle cx="68" cy="47" r="3.5" fill="${stroke}" opacity="0.75" />
  </g>

  <!-- Speed Trails -->
  <line x1="2" y1="68" x2="14" y2="68" stroke="${fill}" stroke-width="4.5" stroke-linecap="round" />
  <line x1="-2" y1="76" x2="16" y2="76" stroke="${fill}" stroke-width="5" stroke-linecap="round" />
  <line x1="4" y1="84" x2="12" y2="84" stroke="${fill}" stroke-width="4.5" stroke-linecap="round" />

  <!-- Smooth Swoosh Check Stem -->
  <path d="M22 62 Q34 84 46 76 L76 44" stroke="${fill}" stroke-width="9.5" stroke-linecap="round" />

  <!-- Bold, Sleek Arrowhead pointing boldly at 45° -->
  <polygon points="96,24 67,34 76,43 86,52" fill="${fill}" stroke="${fill}" stroke-width="2.5" stroke-linejoin="round" />
</svg>`;
}

// ============================================================================
// VARIATION 3D: "PURE VECTOR ICON" (Proporciones Áureas / Geometría Perfecta)
// Punta de flecha sobredimensionada con barbas biseladas, visibilidad legendaria
// ============================================================================
function getVar3D(colorMode = 'white', width = 100, height = 100) {
  const isWhite = colorMode === 'white';
  const stroke = isWhite ? '#ffffff' : '#0f172a';
  const fill = isWhite ? '#ffffff' : '#009ee3';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${width}" height="${height}" fill="none">
  <defs>
    <mask id="mask-3d-${colorMode}">
      <rect width="100" height="100" fill="#ffffff" />
      <!-- Negative space cutout tunnel -->
      <path d="M18 64 L38 82 L72 48" stroke="#000000" stroke-width="19" stroke-linecap="round" stroke-linejoin="round" />
      <polygon points="60,42 98,20 78,58" fill="#000000" />
      <circle cx="82" cy="34" r="16" fill="#000000" />
    </mask>
  </defs>

  <!-- Rings -->
  <rect x="27" y="6" width="9" height="17" rx="4.5" fill="${stroke}" />
  <rect x="64" y="6" width="9" height="17" rx="4.5" fill="${stroke}" />

  <!-- Calendar Body -->
  <g mask="url(#mask-3d-${colorMode})">
    <rect x="14" y="16" width="72" height="72" rx="17" stroke="${stroke}" stroke-width="6.5" />
    <path d="M16 33 C16 23 22 18 31 18 H69 C78 18 84 23 84 33 V36 H16 V32 Z" fill="${stroke}" />
    <!-- Grid -->
    <rect x="28" y="45" width="8" height="6" rx="3" fill="${stroke}" opacity="0.65" />
    <rect x="47" y="45" width="8" height="6" rx="3" fill="${stroke}" opacity="0.65" />
    <rect x="66" y="45" width="8" height="6" rx="3" fill="${stroke}" opacity="0.65" />
  </g>

  <!-- Speed Lines -->
  <line x1="1" y1="65" x2="14" y2="65" stroke="${fill}" stroke-width="4.5" stroke-linecap="round" />
  <line x1="-3" y1="73" x2="17" y2="73" stroke="${fill}" stroke-width="5" stroke-linecap="round" />
  <line x1="3" y1="81" x2="13" y2="81" stroke="${fill}" stroke-width="4.5" stroke-linecap="round" />

  <!-- Checkmark Stem -->
  <path d="M22 64 L38 80 L74 44" stroke="${fill}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />

  <!-- HUGE ICONIC TRIANGULAR ARROWHEAD: Breaks clean out of the calendar -->
  <!-- Tip: (97, 21). Left barb: (68, 30). Notch: (76, 42). Right barb: (88, 50) -->
  <polygon points="97,21 68,30 76,42 88,50" fill="${fill}" stroke="${fill}" stroke-width="2.5" stroke-linejoin="round" />
</svg>`;
}

// Build HTML comparison
const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Perfeccionamiento del Check-Arrow - Turnos Ya</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #009ee3;
      color: white;
      padding: 3rem 2.5rem;
    }
    .header {
      text-align: center;
      max-width: 820px;
      margin: 0 auto 2.5rem auto;
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
      background: rgba(255, 255, 255, 0.14);
      border: 1.5px solid rgba(255, 255, 255, 0.28);
      border-radius: 20px;
      padding: 1.75rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .badge {
      display: inline-block;
      background: white;
      color: #009ee3;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 0.75rem;
    }
    .badge-star {
      background: #ffb800;
      color: #0f172a;
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
      margin-bottom: 1.25rem;
    }
    .preview-row {
      background: #009ee3;
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 12px;
      padding: 12px 18px;
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
      background: rgba(0, 0, 0, 0.15);
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
      color: #94a3b8;
      font-size: 0.75rem;
    }
    .zoom-row {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
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
    <h1>Perfeccionamiento del Concepto "Check-Arrow"</h1>
    <p class="lead">
      El concepto que elegiste (<strong>Turno Confirmado + Despegue Inmediato</strong>) corregido con <strong>puntas de flecha triangulares sólidas, simétricas y de alto impacto</strong>, y un túnel de aire limpio para que la flecha destaque al 100%.
    </p>
  </div>

  <div class="grid">
    <!-- VARIACION 3A -->
    <div class="card">
      <div>
        <span class="badge">Variación 3A</span>
        <div class="title">Delta Check (Punta Delta Afilada)</div>
        <div class="desc">
          Punta de flecha triangular geométrica a 45° exactos con muesca trasera biselada. Se conecta con el vástago del check de forma limpia e inequívoca.
        </div>

        <div class="preview-row">
          <div class="brand-preview">
            ${getVar3A('white', 36, 36)}
            <span class="brand-text">Turnos<span>Ya</span></span>
          </div>
          <span style="font-size: 0.8rem; opacity: 0.8;">Navbar (36px)</span>
        </div>

        <div class="mobile-mock">
          <div class="mobile-top">
            <div class="brand-preview">
              ${getVar3A('white', 28, 28)}
              <span class="brand-text" style="font-size: 1.15rem;">Turnos<span>Ya</span></span>
            </div>
            <span style="font-size: 0.8rem;">🔔 👤</span>
          </div>
          <div class="mobile-search">Buscar negocios...</div>
        </div>
      </div>

      <div class="zoom-row">
        <span class="zoom-label">Detalle 75px:</span>
        ${getVar3A('white', 75, 75)}
      </div>
    </div>

    <!-- VARIACION 3B -->
    <div class="card">
      <div>
        <span class="badge">Variación 3B</span>
        <div class="title">Stealth Wing (Punta Clásica Isósceles)</div>
        <div class="desc">
          Punta de flecha triangular pura y grande con alas extendidas a los lados del vástago. Silueta clásica de máxima legibilidad instantánea.
        </div>

        <div class="preview-row">
          <div class="brand-preview">
            ${getVar3B('white', 36, 36)}
            <span class="brand-text">Turnos<span>Ya</span></span>
          </div>
          <span style="font-size: 0.8rem; opacity: 0.8;">Navbar (36px)</span>
        </div>

        <div class="mobile-mock">
          <div class="mobile-top">
            <div class="brand-preview">
              ${getVar3B('white', 28, 28)}
              <span class="brand-text" style="font-size: 1.15rem;">Turnos<span>Ya</span></span>
            </div>
            <span style="font-size: 0.8rem;">🔔 👤</span>
          </div>
          <div class="mobile-search">Buscar negocios...</div>
        </div>
      </div>

      <div class="zoom-row">
        <span class="zoom-label">Detalle 75px:</span>
        ${getVar3B('white', 75, 75)}
      </div>
    </div>

    <!-- VARIACION 3C -->
    <div class="card">
      <div>
        <span class="badge">Variación 3C</span>
        <div class="title">Swoosh-Check (Curva Fluida Cinética)</div>
        <div class="desc">
          En lugar de una esquina en ángulo recto, la base del checkmark es una **curva aerodinámica continua** que se apoya en el fondo del calendario y despega hacia la punta triangular afilada.
        </div>

        <div class="preview-row">
          <div class="brand-preview">
            ${getVar3C('white', 36, 36)}
            <span class="brand-text">Turnos<span>Ya</span></span>
          </div>
          <span style="font-size: 0.8rem; opacity: 0.8;">Navbar (36px)</span>
        </div>

        <div class="mobile-mock">
          <div class="mobile-top">
            <div class="brand-preview">
              ${getVar3C('white', 28, 28)}
              <span class="brand-text" style="font-size: 1.15rem;">Turnos<span>Ya</span></span>
            </div>
            <span style="font-size: 0.8rem;">🔔 👤</span>
          </div>
          <div class="mobile-search">Buscar negocios...</div>
        </div>
      </div>

      <div class="zoom-row">
        <span class="zoom-label">Detalle 75px:</span>
        ${getVar3C('white', 75, 75)}
      </div>
    </div>

    <!-- VARIACION 3D -->
    <div class="card">
      <div>
        <span class="badge badge-star">Variación 3D (Máxima Fuerza)</span>
        <div class="title">Apex Arrowhead (Punta Heroica de Impacto)</div>
        <div class="desc">
          La punta de la flecha está **sobredimensionada y biselada**, rompiendo el marco superior derecho con total autoridad. La inercia del checkmark y la flecha son 100% evidentes a cualquier distancia.
        </div>

        <div class="preview-row">
          <div class="brand-preview">
            ${getVar3D('white', 36, 36)}
            <span class="brand-text">Turnos<span>Ya</span></span>
          </div>
          <span style="font-size: 0.8rem; opacity: 0.8;">Navbar (36px)</span>
        </div>

        <div class="mobile-mock">
          <div class="mobile-top">
            <div class="brand-preview">
              ${getVar3D('white', 28, 28)}
              <span class="brand-text" style="font-size: 1.15rem;">Turnos<span>Ya</span></span>
            </div>
            <span style="font-size: 0.8rem;">🔔 👤</span>
          </div>
          <div class="mobile-search">Buscar negocios...</div>
        </div>
      </div>

      <div class="zoom-row">
        <span class="zoom-label">Detalle 75px:</span>
        ${getVar3D('white', 75, 75)}
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('Turnos_ya_frontend_web-main/public/check-arrow-showcase.html', html);
console.log('Check-Arrow showcase created successfully!');

