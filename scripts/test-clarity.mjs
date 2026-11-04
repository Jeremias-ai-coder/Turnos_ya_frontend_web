import fs from 'fs';

// OPTION A+ (Enhanced): Solid Calendar Header + Clean Calendar Days at top + Powerful Dynamic Arrow in foreground
function getVarAPlusSvg(colorMode = 'white', width = 100, height = 100) {
  const isWhite = colorMode === 'white';
  const mainColor = isWhite ? '#ffffff' : '#0f172a';
  const accentColor = isWhite ? '#ffffff' : '#009ee3';
  const bgBlue = '#009ee3';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${width}" height="${height}" fill="none">
  <!-- Top Binder Rings -->
  <rect x="27" y="5" width="9" height="18" rx="4.5" fill="${mainColor}" />
  <rect x="64" y="5" width="9" height="18" rx="4.5" fill="${mainColor}" />

  <!-- Calendar Outer Frame -->
  <rect x="13" y="15" width="74" height="74" rx="18" stroke="${mainColor}" stroke-width="6.5" />

  <!-- Solid Header Bar (Instantly identifies it as a Calendar) -->
  <path d="M16 32 C16 23 22 18 30 18 H70 C78 18 84 23 84 32 V36 H16 V32 Z" fill="${mainColor}" />

  <!-- Minimal Calendar Date Dots/Grid (Cleanly placed at top, never touching the arrow) -->
  <rect x="25" y="44" width="9" height="7" rx="3.5" fill="${mainColor}" opacity="0.8" />
  <rect x="45" y="44" width="9" height="7" rx="3.5" fill="${mainColor}" opacity="0.8" />
  <rect x="65" y="44" width="9" height="7" rx="3.5" fill="${mainColor}" opacity="0.8" />
  <rect x="25" y="57" width="9" height="7" rx="3.5" fill="${mainColor}" opacity="0.8" />

  <!-- Negative Space Knockout (Cuts clean space around the arrow) -->
  <path d="M4 86 C24 86 46 80 62 66" stroke="${isWhite ? bgBlue : '#ffffff'}" stroke-width="18" stroke-linecap="round" />
  <path d="M66 52 L98 40 L88 18 L58 32 Z" fill="${isWhite ? bgBlue : '#ffffff'}" />

  <!-- SPEED TRAILS ON LEFT -->
  <line x1="2" y1="74" x2="13" y2="74" stroke="${accentColor}" stroke-width="4.5" stroke-linecap="round" />
  <line x1="-1" y1="82" x2="14" y2="82" stroke="${accentColor}" stroke-width="5" stroke-linecap="round" />
  <line x1="3" y1="90" x2="12" y2="90" stroke="${accentColor}" stroke-width="4.5" stroke-linecap="round" />

  <!-- THE HERO DYNAMIC ARROW (Sweeping Bold Ribbon + Sharp Arrowhead) -->
  <path d="M8 86 C26 86 48 80 66 64 C74 56 80 48 84 38" stroke="${accentColor}" stroke-width="9.5" stroke-linecap="round" />
  <polygon points="68,36 97,27 89,58 79,45" fill="${accentColor}" stroke="${accentColor}" stroke-width="2.5" stroke-linejoin="round" />
</svg>`;
}

// Option A2: Filled Solid White Card with Cutout/Blue Details
function getVarA2Svg(colorMode = 'white', width = 100, height = 100) {
  const isWhite = colorMode === 'white';
  const mainColor = isWhite ? '#ffffff' : '#0f172a';
  const accent = isWhite ? '#009ee3' : '#009ee3';

  // In this version, the entire calendar is a SOLID WHITE FILLED SHAPE with blue cuts!
  // In the navbar, the calendar is a solid crisp white card, and inside it the date grid and arrow are cutout or blue!
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${width}" height="${height}" fill="none">
  <!-- Top Rings -->
  <rect x="27" y="6" width="9" height="18" rx="4.5" fill="#ffffff" />
  <rect x="64" y="6" width="9" height="18" rx="4.5" fill="#ffffff" />

  <!-- Solid Calendar Card -->
  <rect x="13" y="16" width="74" height="72" rx="16" fill="#ffffff" />

  <!-- Header line cutout -->
  <line x1="13" y1="36" x2="87" y2="36" stroke="#009ee3" stroke-width="5" />

  <!-- Grid dots in blue -->
  <rect x="25" y="44" width="8" height="6" rx="3" fill="#009ee3" opacity="0.6" />
  <rect x="46" y="44" width="8" height="6" rx="3" fill="#009ee3" opacity="0.6" />
  <rect x="67" y="44" width="8" height="6" rx="3" fill="#009ee3" opacity="0.6" />
  <rect x="25" y="56" width="8" height="6" rx="3" fill="#009ee3" opacity="0.6" />

  <!-- Speed trails -->
  <path d="M4 74h10M0 82h12M4 90h8" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" />

  <!-- Vibrant Blue Arrow bursting out! -->
  <path d="M8 86C26 86 48 80 66 64C74 56 80 48 84 38" stroke="#009ee3" stroke-width="10" stroke-linecap="round" />
  <polygon points="68,36 98,26 89,58 79,44" fill="#009ee3" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" />
</svg>`;
}

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comparación Detallada</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #009ee3;
      color: white;
      padding: 2.5rem;
    }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .card {
      background: rgba(255, 255, 255, 0.12);
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      border-radius: 16px;
      padding: 1.75rem;
    }
    .brand-preview { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 1rem; }
    .brand-text { font-size: 1.45rem; font-weight: 800; letter-spacing: -0.5px; }
    .brand-text span { font-weight: 900; margin-left: 2px; }
  </style>
</head>
<body>
  <h1 style="font-size: 1.6rem; margin-bottom: 1.5rem;">Prueba de Claridad de la Flecha</h1>

  <div class="grid">
    <div class="card">
      <h2 style="font-size: 1.2rem; margin-bottom: 0.5rem;">Opción 1: Flecha Blanca Gruesa con Corte de Aire (Knockout)</h2>
      <p style="font-size: 0.85rem; opacity: 0.85; margin-bottom: 1rem;">
        La flecha es 100% blanca, gruesa y sólida. Un corte limpio de separación borra cualquier línea del calendario alrededor de ella para que nunca se crucen.
      </p>

      <div class="brand-preview">
        ${getVarAPlusSvg('white', 40, 40)}
        <span class="brand-text">Turnos<span>Ya</span></span>
      </div>

      <div style="background: rgba(0,0,0,0.15); padding: 12px; border-radius: 10px; max-width: 340px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: inline-flex; align-items: center; gap: 8px;">
            ${getVarAPlusSvg('white', 30, 30)}
            <span style="font-size: 1.15rem; font-weight: 800;">Turnos<span style="font-weight: 900;">Ya</span></span>
          </div>
          <span>🔔 👤</span>
        </div>
        <div style="background: white; border-radius: 6px; padding: 6px 12px; color: #94a3b8; font-size: 0.75rem;">Buscar...</div>
      </div>

      <div style="margin-top: 1.5rem; display: flex; align-items: center; gap: 1rem;">
        <span>Zoom grande (80px):</span>
        ${getVarAPlusSvg('white', 80, 80)}
      </div>
    </div>

    <div class="card">
      <h2 style="font-size: 1.2rem; margin-bottom: 0.5rem;">Opción 2: Tarjeta Blanca Sólida con Flecha Cyan con Borde</h2>
      <p style="font-size: 0.85rem; opacity: 0.85; margin-bottom: 1rem;">
        El calendario es una tarjeta blanca rellena con relieve y la flecha es de color cyan con borde blanco, creando un contraste figura-fondo instantáneo.
      </p>

      <div class="brand-preview">
        ${getVarA2Svg('white', 40, 40)}
        <span class="brand-text">Turnos<span>Ya</span></span>
      </div>

      <div style="background: rgba(0,0,0,0.15); padding: 12px; border-radius: 10px; max-width: 340px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: inline-flex; align-items: center; gap: 8px;">
            ${getVarA2Svg('white', 30, 30)}
            <span style="font-size: 1.15rem; font-weight: 800;">Turnos<span style="font-weight: 900;">Ya</span></span>
          </div>
          <span>🔔 👤</span>
        </div>
        <div style="background: white; border-radius: 6px; padding: 6px 12px; color: #94a3b8; font-size: 0.75rem;">Buscar...</div>
      </div>

      <div style="margin-top: 1.5rem; display: flex; align-items: center; gap: 1rem;">
        <span>Zoom grande (80px):</span>
        ${getVarA2Svg('white', 80, 80)}
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('Turnos_ya_frontend_web-main/public/clarity-test.html', html);

