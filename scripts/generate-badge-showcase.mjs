import fs from 'fs';
import path from 'path';

function renderBadge(style = 'check', colorMode = 'white', fontSize = 32) {
  const isWhite = colorMode === 'white';
  const textTurnos = isWhite ? '#ffffff' : '#0f172a';
  const badgeBg = isWhite ? '#ffffff' : '#009ee3';
  const badgeText = isWhite ? '#009ee3' : '#ffffff';

  let iconSvg = '';
  if (style === 'check') {
    // Checkmark
    iconSvg = `<svg viewBox="0 0 24 24" width="${fontSize * 0.58}" height="${fontSize * 0.58}" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (style === 'arrow') {
    // Up-right speed arrow ↗
    iconSvg = `<svg viewBox="0 0 24 24" width="${fontSize * 0.58}" height="${fontSize * 0.58}" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>`;
  } else if (style === 'fast') {
    // Fast forward >>
    iconSvg = `<svg viewBox="0 0 24 24" width="${fontSize * 0.58}" height="${fontSize * 0.58}" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>`;
  } else if (style === 'minimal') {
    // Pure clean text
    iconSvg = '';
  }

  return `<div style="display: inline-flex; align-items: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1;">
    <span style="font-size: ${fontSize}px; font-weight: 800; letter-spacing: -0.8px; color: ${textTurnos};">
      Turnos
    </span>
    <span style="
      background: ${badgeBg};
      color: ${badgeText};
      font-size: ${fontSize * 0.8}px;
      font-weight: 900;
      letter-spacing: -0.2px;
      padding: ${fontSize * 0.15}px ${fontSize * (iconSvg ? 0.36 : 0.42)}px;
      border-radius: ${fontSize * 0.28}px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      transform: skewX(-10deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    ">
      <span style="transform: skewX(10deg); display: inline-flex; align-items: center;">
        Ya${iconSvg}
      </span>
    </span>
  </div>`;
}

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Sub-variaciones de la Cápsula Speed-Badge</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #009ee3;
      color: white;
      padding: 3rem 2.5rem;
    }
    .header { text-align: center; max-width: 820px; margin: 0 auto 2.5rem auto; }
    h1 { font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; letter-spacing: -0.5px; }
    p.lead { font-size: 1rem; opacity: 0.92; line-height: 1.5; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 1200px; margin: 0 auto; }
    .card {
      background: rgba(255, 255, 255, 0.14);
      border: 1.5px solid rgba(255, 255, 255, 0.28);
      border-radius: 20px;
      padding: 1.75rem;
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
    .title { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.4rem; }
    .desc { font-size: 0.88rem; opacity: 0.9; margin-bottom: 1.25rem; line-height: 1.45; }
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
      margin-bottom: 1rem;
    }
    .mobile-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .mobile-search { background: white; border-radius: 20px; padding: 6px 14px; color: #94a3b8; font-size: 0.75rem; }
    .white-preview { background: white; border-radius: 12px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Sub-variaciones de la Cápsula Speed-Badge</h1>
    <p class="lead">Observa el detalle interior del badge "Ya": con Check, con Flecha de velocidad ↗, con Doble Chevron » o Minimalista puro.</p>
  </div>

  <div class="grid">
    <!-- 1A: CHECK -->
    <div class="card">
      <span class="badge">Variante 1A</span>
      <div class="title">Con Check de Confirmación (Ya ✓)</div>
      <div class="desc">Transmite reserva exitosa y garantizada al instante.</div>
      <div class="preview-row">
        ${renderBadge('check', 'white', 30)}
        <span style="font-size: 0.8rem; opacity: 0.8;">Navbar Desktop</span>
      </div>
      <div class="mobile-mock">
        <div class="mobile-top">
          ${renderBadge('check', 'white', 22)}
          <span style="font-size: 0.8rem;">🔔 👤</span>
        </div>
        <div class="mobile-search">Buscar negocios...</div>
      </div>
      <div class="white-preview">
        <div>${renderBadge('check', 'color', 26)}</div>
        <span style="font-size: 0.75rem; color: #64748b; font-weight: 700;">FONDO BLANCO</span>
      </div>
    </div>

    <!-- 1B: FLECHA VELOCIDAD -->
    <div class="card">
      <span class="badge">Variante 1B</span>
      <div class="title">Con Flecha Ascendente (Ya ↗)</div>
      <div class="desc">Transmite rapidez, aceleración de agenda y crecimiento.</div>
      <div class="preview-row">
        ${renderBadge('arrow', 'white', 30)}
        <span style="font-size: 0.8rem; opacity: 0.8;">Navbar Desktop</span>
      </div>
      <div class="mobile-mock">
        <div class="mobile-top">
          ${renderBadge('arrow', 'white', 22)}
          <span style="font-size: 0.8rem;">🔔 👤</span>
        </div>
        <div class="mobile-search">Buscar negocios...</div>
      </div>
      <div class="white-preview">
        <div>${renderBadge('arrow', 'color', 26)}</div>
        <span style="font-size: 0.75rem; color: #64748b; font-weight: 700;">FONDO BLANCO</span>
      </div>
    </div>

    <!-- 1C: CHEVRONS -->
    <div class="card">
      <span class="badge">Variante 1C</span>
      <div class="title">Con Chevrons de Avance Rápido (Ya »)</div>
      <div class="desc">Transmite velocidad continua, turnos inmediatos sin colas.</div>
      <div class="preview-row">
        ${renderBadge('fast', 'white', 30)}
        <span style="font-size: 0.8rem; opacity: 0.8;">Navbar Desktop</span>
      </div>
      <div class="mobile-mock">
        <div class="mobile-top">
          ${renderBadge('fast', 'white', 22)}
          <span style="font-size: 0.8rem;">🔔 👤</span>
        </div>
        <div class="mobile-search">Buscar negocios...</div>
      </div>
      <div class="white-preview">
        <div>${renderBadge('fast', 'color', 26)}</div>
        <span style="font-size: 0.75rem; color: #64748b; font-weight: 700;">FONDO BLANCO</span>
      </div>
    </div>

    <!-- 1D: MINIMALISTA -->
    <div class="card">
      <span class="badge">Variante 1D</span>
      <div class="title">Cápsula Tipográfica Pura (Ya)</div>
      <div class="desc">Limpio, directo y ultra contundente estilo PedidosYa / YouTube.</div>
      <div class="preview-row">
        ${renderBadge('minimal', 'white', 30)}
        <span style="font-size: 0.8rem; opacity: 0.8;">Navbar Desktop</span>
      </div>
      <div class="mobile-mock">
        <div class="mobile-top">
          ${renderBadge('minimal', 'white', 22)}
          <span style="font-size: 0.8rem;">🔔 👤</span>
        </div>
        <div class="mobile-search">Buscar negocios...</div>
      </div>
      <div class="white-preview">
        <div>${renderBadge('minimal', 'color', 26)}</div>
        <span style="font-size: 0.75rem; color: #64748b; font-weight: 700;">FONDO BLANCO</span>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('Turnos_ya_frontend_web-main/public/badge-showcase.html', html);
console.log('Badge showcase created successfully!');

