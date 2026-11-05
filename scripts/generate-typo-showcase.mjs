import fs from 'fs';
import path from 'path';

// ============================================================================
// TYPOGRAPHIC PROPOSAL 1: "THE SPEED-CAPSULE" (Cápsula de Aceleración)
// 'Turnos' limpio + 'Ya!' en badge aerodinámico invertido.
// En navbar: 'Turnos' blanco + 'Ya' en cápsula blanca con letras azul primario.
// ¡Contraste brutal, legibilidad legendaria, estilo PedidosYa / YouTube / Mercado Libre!
// ============================================================================
function getTypo1(colorMode = 'white', fontSize = 32) {
  const isWhite = colorMode === 'white';
  const textTurnosColor = isWhite ? '#ffffff' : '#0f172a';
  const badgeBg = isWhite ? '#ffffff' : '#009ee3';
  const badgeTextColor = isWhite ? '#009ee3' : '#ffffff';

  return `<div class="typo-logo typo-1" style="display: inline-flex; align-items: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1;">
    <span style="font-size: ${fontSize}px; font-weight: 800; letter-spacing: -0.8px; color: ${textTurnosColor};">
      Turnos
    </span>
    <span style="
      background: ${badgeBg};
      color: ${badgeTextColor};
      font-size: ${fontSize * 0.82}px;
      font-weight: 900;
      letter-spacing: -0.3px;
      padding: ${fontSize * 0.14}px ${fontSize * 0.38}px;
      border-radius: ${fontSize * 0.3}px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      transform: skewX(-10deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    ">
      <span style="transform: skewX(10deg); display: inline-flex; align-items: center; gap: 2px;">
        Ya<svg viewBox="0 0 24 24" width="${fontSize * 0.6}" height="${fontSize * 0.6}" fill="currentColor" style="margin-left: 1px;"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
    </span>
  </div>`;
}

// ============================================================================
// TYPOGRAPHIC PROPOSAL 2: "THE APEX 'Y'" (Flecha Ascendente Nacida de la 'Y')
// La letra 'Y' de 'Ya' tiene su brazo derecho extendido como una flecha supersónica
// ============================================================================
function getTypo2(colorMode = 'white', height = 44) {
  const isWhite = colorMode === 'white';
  const colorTurnos = isWhite ? '#ffffff' : '#0f172a';
  const colorYa = isWhite ? '#ffffff' : '#009ee3';
  const arrowColor = isWhite ? '#ffffff' : '#009ee3';

  // SVG viewBox: 0 0 260 50
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 52" height="${height}" fill="none">
    <!-- Speed Lines left of T -->
    <line x1="4" y1="22" x2="16" y2="22" stroke="${colorTurnos}" stroke-width="3" stroke-linecap="round" opacity="0.7" />
    <line x1="1" y1="28" x2="19" y2="28" stroke="${colorTurnos}" stroke-width="3.5" stroke-linecap="round" opacity="0.9" />
    <line x1="5" y1="34" x2="15" y2="34" stroke="${colorTurnos}" stroke-width="3" stroke-linecap="round" opacity="0.7" />

    <!-- Text: Turnos -->
    <text x="25" y="38" font-family="'Plus Jakarta Sans', sans-serif" font-size="34" font-weight="800" letter-spacing="-0.8" fill="${colorTurnos}">Turnos</text>

    <!-- 'Y' custom vector with ascending arrow wing -->
    <!-- Stem of Y -->
    <path d="M162 18 L170 30 L170 42" stroke="${colorYa}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M178 18 L170 30" stroke="${colorYa}" stroke-width="5.5" stroke-linecap="round" />
    <!-- Dynamic flight trail extending to arrow above 'a' -->
    <path d="M170 30 C176 26 186 16 206 10" stroke="${arrowColor}" stroke-width="5" stroke-linecap="round" />
    <!-- Arrowhead -->
    <polygon points="214,8 198,8 205,17" fill="${arrowColor}" />

    <!-- Text: a of 'Ya' -->
    <text x="182" y="38" font-family="'Plus Jakarta Sans', sans-serif" font-size="34" font-weight="900" letter-spacing="-0.5" fill="${colorYa}">a</text>
  </svg>`;
}

// ============================================================================
// TYPOGRAPHIC PROPOSAL 3: "FAST-FORWARD >>" (Aceleración Cinética)
// 'TurnosYa' con doble chevron de velocidad integrado como cola dinámica
// ============================================================================
function getTypo3(colorMode = 'white', height = 44) {
  const isWhite = colorMode === 'white';
  const colorTurnos = isWhite ? '#ffffff' : '#0f172a';
  const colorYa = isWhite ? '#ffffff' : '#009ee3';
  const chevronColor = isWhite ? 'rgba(255,255,255,0.95)' : '#009ee3';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 50" height="${height}" fill="none">
    <!-- Turnos -->
    <text x="4" y="36" font-family="'Plus Jakarta Sans', sans-serif" font-size="33" font-weight="800" letter-spacing="-0.8" fill="${colorTurnos}">Turnos</text>
    <!-- Ya -->
    <text x="146" y="36" font-family="'Plus Jakarta Sans', sans-serif" font-size="33" font-weight="900" letter-spacing="-0.4" fill="${colorYa}">Ya</text>

    <!-- Dual Fast-Forward Chevrons >> trailing the word -->
    <path d="M204 18 L214 27 L204 36" stroke="${chevronColor}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M214 18 L224 27 L214 36" stroke="${chevronColor}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;
}

// ============================================================================
// TYPOGRAPHIC PROPOSAL 4: "THE SONIC BOLT" (Rayo / Flecha Ascendente Integrada)
// Una flecha de ascenso rápido ↗ brota con orgullo del punto de la última letra
// ============================================================================
function getTypo4(colorMode = 'white', height = 44) {
  const isWhite = colorMode === 'white';
  const colorTurnos = isWhite ? '#ffffff' : '#0f172a';
  const colorYa = isWhite ? '#ffffff' : '#009ee3';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 50" height="${height}" fill="none">
    <!-- Turnos -->
    <text x="4" y="36" font-family="'Plus Jakarta Sans', sans-serif" font-size="34" font-weight="800" letter-spacing="-0.8" fill="${colorTurnos}">Turnos</text>
    <!-- Ya -->
    <text x="148" y="36" font-family="'Plus Jakarta Sans', sans-serif" font-size="34" font-weight="900" letter-spacing="-0.4" fill="${colorYa}">Ya</text>

    <!-- Dynamic Rising Arrow Rocket launching out of 'Ya' -->
    <path d="M202 32 C206 26 212 18 224 10" stroke="${colorYa}" stroke-width="4.5" stroke-linecap="round" />
    <polygon points="232,8 217,10 224,19" fill="${colorYa}" stroke="${colorYa}" stroke-width="1.5" stroke-linejoin="round" />

    <!-- 2 tiny speed lines behind it -->
    <line x1="198" y1="24" x2="204" y2="24" stroke="${colorYa}" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />
    <line x1="195" y1="28" x2="201" y2="28" stroke="${colorYa}" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />
  </svg>`;
}

// Build HTML showcase
const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Logotipos Tipográficos Integrales - Turnos Ya</title>
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
      max-width: 840px;
      margin: 0 auto 2.5rem auto;
    }
    h1 { font-size: 2.1rem; font-weight: 900; margin-bottom: 0.5rem; letter-spacing: -0.5px; }
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
      margin-bottom: 0.4rem;
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
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
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
    .white-preview {
      background: #ffffff;
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .white-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Logotipos Tipográficos Integrales para Turnos Ya</h1>
    <p class="lead">
      Sin isotipos de calendario sueltos al lado. La identidad, el dinamismo y la velocidad ("Ya") están <strong>fundidos orgánicamente dentro de la propia tipografía</strong>. Máxima pulcritud, legibilidad insuperable y espacio perfecto en mobile.
    </p>
  </div>

  <div class="grid">
    <!-- PROPUESTA T1 -->
    <div class="card">
      <div>
        <span class="badge badge-star">Concepto 1 (Favorito de Producto)</span>
        <div class="title">The Speed-Badge (Cápsula Aerodinámica con Check)</div>
        <div class="desc">
          "Turnos" en tipografía nítida blanca + <strong>"Ya" contenido en una cápsula inclinada con check de confirmación</strong>. En el navbar, la cápsula blanca con texto azul crea un contraste potente estilo PedidosYa / Mercado Libre.
        </div>

        <div class="preview-row">
          ${getTypo1('white', 30)}
          <span style="font-size: 0.8rem; opacity: 0.8;">Navbar (Desktop)</span>
        </div>

        <div class="mobile-mock">
          <div class="mobile-top">
            ${getTypo1('white', 22)}
            <span style="font-size: 0.8rem;">🔔 👤</span>
          </div>
          <div class="mobile-search">Buscar negocios...</div>
        </div>
      </div>

      <div class="white-preview">
        <div>${getTypo1('color', 26)}</div>
        <span class="white-label">Fondo Blanco (Login)</span>
      </div>
    </div>

    <!-- PROPUESTA T2 -->
    <div class="card">
      <div>
        <span class="badge">Concepto 2</span>
        <div class="title">The Apex 'Y' (Flecha Nacida de la 'Y')</div>
        <div class="desc">
          Líneas de velocidad sutiles impulsan la 'T' de Turnos, y el brazo superior de la <strong>'Y' despega en diagonal como una flecha supersónica</strong> que sobrevuela la 'a'. La velocidad nace de la misma palabra.
        </div>

        <div class="preview-row">
          ${getTypo2('white', 38)}
          <span style="font-size: 0.8rem; opacity: 0.8;">Navbar (Desktop)</span>
        </div>

        <div class="mobile-mock">
          <div class="mobile-top">
            ${getTypo2('white', 30)}
            <span style="font-size: 0.8rem;">🔔 👤</span>
          </div>
          <div class="mobile-search">Buscar negocios...</div>
        </div>
      </div>

      <div class="white-preview">
        <div>${getTypo2('color', 34)}</div>
        <span class="white-label">Fondo Blanco (Login)</span>
      </div>
    </div>

    <!-- PROPUESTA T3 -->
    <div class="card">
      <div>
        <span class="badge">Concepto 3</span>
        <div class="title">Fast-Forward >> (Chevrons Cinéticos)</div>
        <div class="desc">
          Inspirado en fintechs ágiles (Stripe / Revolut). 'Turnos' limpio y 'Ya' con <strong>doble chevron acelerador '>>'</strong> al final. Comunica "adelantar tu turno / turno al instante" sin ningún dibujo infantil.
        </div>

        <div class="preview-row">
          ${getTypo3('white', 38)}
          <span style="font-size: 0.8rem; opacity: 0.8;">Navbar (Desktop)</span>
        </div>

        <div class="mobile-mock">
          <div class="mobile-top">
            ${getTypo3('white', 30)}
            <span style="font-size: 0.8rem;">🔔 👤</span>
          </div>
          <div class="mobile-search">Buscar negocios...</div>
        </div>
      </div>

      <div class="white-preview">
        <div>${getTypo3('color', 34)}</div>
        <span class="white-label">Fondo Blanco (Login)</span>
      </div>
    </div>

    <!-- PROPUESTA T4 -->
    <div class="card">
      <div>
        <span class="badge">Concepto 4</span>
        <div class="title">The Kinetic Vector (Flecha Cohete ↗ en 'Ya')</div>
        <div class="desc">
          Tipografía minimalista y ultra pulcra donde una <strong>flecha de despegue con estelas de velocidad</strong> se proyecta en ángulo de 45° desde el final de la 'a' de "Ya". Elegante, sobrio y digital.
        </div>

        <div class="preview-row">
          ${getTypo4('white', 38)}
          <span style="font-size: 0.8rem; opacity: 0.8;">Navbar (Desktop)</span>
        </div>

        <div class="mobile-mock">
          <div class="mobile-top">
            ${getTypo4('white', 30)}
            <span style="font-size: 0.8rem;">🔔 👤</span>
          </div>
          <div class="mobile-search">Buscar negocios...</div>
        </div>
      </div>

      <div class="white-preview">
        <div>${getTypo4('color', 34)}</div>
        <span class="white-label">Fondo Blanco (Login)</span>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('Turnos_ya_frontend_web-main/public/typo-showcase.html', html);
console.log('Typographic showcase generated successfully!');

