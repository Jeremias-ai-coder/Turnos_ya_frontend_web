import fs from 'fs';
import path from 'path';

// Clean SVG Isotype Generator
function getIsotypeSvg(colorMode = 'white', width = 100, height = 100) {
  // Colors
  const isWhite = colorMode === 'white';
  const mainStroke = isWhite ? '#ffffff' : '#0f172a';
  const accentColor = isWhite ? '#ffffff' : '#009ee3';
  const gridColor = isWhite ? 'rgba(255, 255, 255, 0.65)' : 'rgba(15, 23, 42, 0.2)';
  const bodyFill = isWhite ? 'rgba(255, 255, 255, 0.1)' : '#ffffff';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${width}" height="${height}" fill="none">
  <!-- Calendar Hanger Loops -->
  <rect x="27" y="6" width="9" height="18" rx="4.5" fill="${mainStroke}" />
  <rect x="64" y="6" width="9" height="18" rx="4.5" fill="${mainStroke}" />

  <!-- Calendar Main Outer Shell -->
  <rect x="13" y="16" width="74" height="72" rx="16" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="6" stroke-linejoin="round" />

  <!-- Header Bar Divider -->
  <line x1="16" y1="35" x2="84" y2="35" stroke="${mainStroke}" stroke-width="5" stroke-linecap="round" />

  <!-- Calendar Grid (Subtle, balanced) -->
  <line x1="37" y1="46" x2="37" y2="76" stroke="${gridColor}" stroke-width="3" stroke-linecap="round" />
  <line x1="63" y1="46" x2="63" y2="76" stroke="${gridColor}" stroke-width="3" stroke-linecap="round" />
  <line x1="23" y1="53" x2="77" y2="53" stroke="${gridColor}" stroke-width="3" stroke-linecap="round" />
  <line x1="23" y1="67" x2="52" y2="67" stroke="${gridColor}" stroke-width="3" stroke-linecap="round" />

  <!-- Speed Trails on Bottom-Left -->
  <path d="M5 74h10" stroke="${accentColor}" stroke-width="3.5" stroke-linecap="round" />
  <path d="M2 81h14" stroke="${accentColor}" stroke-width="4" stroke-linecap="round" />
  <path d="M6 88h10" stroke="${accentColor}" stroke-width="3.5" stroke-linecap="round" />

  <!-- Dynamic Swoosh Body (smooth curve) -->
  <path d="M11 86C26 86 48 82 66 67C76 58 82 49 85 41" stroke="${accentColor}" stroke-width="7" stroke-linecap="round" />

  <!-- Dynamic Arrowhead -->
  <path d="M72 38L93 34L87 55L82 45Z" fill="${accentColor}" stroke="${accentColor}" stroke-width="2" stroke-linejoin="round" />
</svg>`;
}

// Full Horizontal Logo (Single line)
function getFullLogoSvg(colorMode = 'white', width = 310, height = 75) {
  const isWhite = colorMode === 'white';
  const textColorTurnos = isWhite ? '#ffffff' : '#0f172a';
  const textColorYa = isWhite ? '#ffffff' : '#009ee3';

  // SVG viewBox: 0 0 320 80
  const isotype = getIsotypeSvg(colorMode, 64, 64);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="${width}" height="${height}" fill="none">
  <!-- Isotipo translated -->
  <g transform="translate(6, 8)">
    ${isotype.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="64" height="64" fill="none">', '').replace('</svg>', '')}
  </g>

  <!-- Text: Turnos -->
  <text x="108" y="54" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="38" font-weight="800" letter-spacing="-0.5" fill="${textColorTurnos}">Turnos</text>

  <!-- Text: Ya -->
  <text x="248" y="54" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="38" font-weight="900" letter-spacing="-0.3" fill="${textColorYa}">Ya</text>
</svg>`;
}

// Generate files for public/assets/brand
const brandDir = path.resolve('Turnos_ya_frontend_web-main/public/assets/brand');
const testHtmlPath = path.resolve('Turnos_ya_frontend_web-main/public/brand-preview.html');

fs.writeFileSync(path.join(brandDir, 'icon-white.svg'), getIsotypeSvg('white', 100, 100));
fs.writeFileSync(path.join(brandDir, 'icon-color.svg'), getIsotypeSvg('color', 100, 100));
fs.writeFileSync(path.join(brandDir, 'logo-white.svg'), getFullLogoSvg('white', 280, 70));
fs.writeFileSync(path.join(brandDir, 'logo-color.svg'), getFullLogoSvg('color', 280, 70));

// Also generate HTML preview
const htmlPreview = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Turnos Ya - Brand Assets Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2rem;
    }
    h1 { margin-bottom: 1.5rem; font-size: 1.5rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .card {
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .card-dark {
      background: #009ee3;
      color: white;
    }
    .card-light {
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }
    .preview-box {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1rem 0;
    }
    .mock-navbar {
      background: #009ee3;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      color: white;
      margin-top: 1rem;
    }
    .mock-search {
      flex: 1;
      background: white;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .mock-mobile-nav {
      max-width: 375px;
      background: #009ee3;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      margin-top: 1rem;
    }
    .mock-mobile-row1 {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.6rem;
    }
  </style>
</head>
<body>
  <h1>Turnos Ya - Visual Identity & Navbar Test</h1>

  <div class="grid">
    <div class="card card-dark">
      <h3>Navbar Theme (#009ee3) - 100% Crisp White</h3>
      <p style="opacity: 0.85; font-size: 0.85rem; margin-bottom: 1rem;">Máximo contraste, sin choques de celeste sobre azul, nitidez vectorial total.</p>
      
      <div class="preview-box">
        <img src="./assets/brand/logo-white.svg" height="42" alt="Logo White" />
      </div>

      <h4>Simulación Desktop Navbar (Componente React con Plus Jakarta Sans):</h4>
      <div class="mock-navbar">
        <div style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: white;">
          ${getIsotypeSvg('white', 34, 34)}
          <span style="font-size: 1.35rem; font-weight: 800; letter-spacing: -0.5px; line-height: 1;">
            Turnos<span style="font-weight: 900; opacity: 0.95;">Ya</span>
          </span>
        </div>
        <div class="mock-search">Buscar negocios o servicios...</div>
        <div style="font-size: 0.85rem; font-weight: 600;">Mis Turnos &nbsp;|&nbsp; Mi Perfil</div>
      </div>

      <h4 style="margin-top: 1.5rem;">Simulación Mobile Web (375px) con Espaciado UI Corregido:</h4>
      <div class="mock-mobile-nav">
        <div class="mock-mobile-row1">
          <div style="display: inline-flex; align-items: center; gap: 7px; text-decoration: none; color: white;">
            ${getIsotypeSvg('white', 30, 30)}
            <span style="font-size: 1.15rem; font-weight: 800; letter-spacing: -0.4px; line-height: 1;">
              Turnos<span style="font-weight: 900;">Ya</span>
            </span>
          </div>
          <div style="display: flex; gap: 8px; font-size: 0.8rem; align-items: center;">
            <span>🔔</span>
            <span style="background: rgba(255,255,255,0.25); padding: 3px 8px; border-radius: 12px; font-weight: 700;">JP</span>
            <span>🚪</span>
          </div>
        </div>
        <div class="mock-search" style="width: 100%; margin-top: 6px;">Buscar negocios o servicios...</div>
      </div>
    </div>

    <div class="card card-light">
      <h3>Fondos Claros (Login / Registro / Dashboard)</h3>
      <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 1rem;">Tipografía en #0f172a (text-title de la app) y 'Ya' en #009ee3 oficial.</p>
      
      <div class="preview-box">
        <div style="display: inline-flex; align-items: center; gap: 10px; text-decoration: none;">
          ${getIsotypeSvg('color', 42, 42)}
          <span style="font-size: 1.6rem; font-weight: 800; letter-spacing: -0.6px; line-height: 1; color: #0f172a;">
            Turnos<span style="font-weight: 900; color: #009ee3;">Ya</span>
          </span>
        </div>
      </div>

      <h4 style="margin-top: 1rem;">Isotipo Solo:</h4>
      <div class="preview-box" style="gap: 2rem;">
        <div style="background: #009ee3; padding: 10px; border-radius: 10px;">
          ${getIsotypeSvg('white', 40, 40)}
        </div>
        <div style="background: #ffffff; padding: 10px; border: 1px solid #e2e8f0; border-radius: 10px;">
          ${getIsotypeSvg('color', 40, 40)}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(testHtmlPath, htmlPreview);
console.log('Brand assets generated successfully!');
