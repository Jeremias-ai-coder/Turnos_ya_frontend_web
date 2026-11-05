import fs from 'fs';

function renderBadge(colorMode = 'white', fontSize = 27) {
  const isWhite = colorMode === 'white';
  const textTurnos = isWhite ? '#ffffff' : '#0f172a';
  const badgeBg = isWhite ? '#ffffff' : '#009ee3';
  const badgeText = isWhite ? '#009ee3' : '#ffffff';

  const badgeFs = Math.round(fontSize * 0.82);
  const badgePaddingY = Math.round(fontSize * 0.14);
  const badgePaddingX = Math.round(fontSize * 0.36);
  const badgeRadius = Math.round(fontSize * 0.28);
  const checkSize = Math.round(badgeFs * 0.72);

  return `<span class="brand-logo-component brand-logo-${colorMode}" style="display: inline-flex; align-items: center; gap: 8px; user-select: none; text-decoration: none; line-height: 1; font-family: 'Plus Jakarta Sans', sans-serif;">
    <span style="font-size: ${fontSize}px; font-weight: 800; letter-spacing: -0.7px; color: ${textTurnos}; line-height: 1; display: inline-block;">
      Turnos
    </span>
    <span style="
      background: ${badgeBg};
      color: ${badgeText};
      font-size: ${badgeFs}px;
      font-weight: 900;
      letter-spacing: -0.2px;
      padding: ${badgePaddingY}px ${badgePaddingX}px;
      border-radius: ${badgeRadius}px;
      display: inline-flex;
      align-items: center;
      transform: skewX(-10deg);
      box-shadow: ${isWhite ? '0 2px 8px rgba(0, 0, 0, 0.12)' : '0 3px 10px rgba(0, 158, 227, 0.25)'};
      line-height: 1;
    ">
      <span style="transform: skewX(10deg); display: inline-flex; align-items: center; gap: 3px;">
        Ya
        <svg viewBox="0 0 24 24" width="${checkSize}" height="${checkSize}" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin-left: 1px;">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    </span>
  </span>`;
}

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Turnos Ya - Vista Previa Final Implementada</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2.5rem;
    }
    .header { text-align: center; margin-bottom: 2.5rem; }
    h1 { font-size: 1.8rem; font-weight: 900; margin-bottom: 0.4rem; }
    p { color: #64748b; font-size: 0.95rem; }

    .grid { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; max-width: 1180px; margin: 0 auto; align-items: start; }

    /* Desktop Mockup */
    .desktop-card {
      background: #ffffff;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
    }
    .nav-desktop {
      background: #009ee3;
      padding: 0.85rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }
    .search-desktop {
      flex: 1;
      max-width: 480px;
      background: white;
      border-radius: 24px;
      padding: 8px 18px;
      font-size: 0.88rem;
      color: #94a3b8;
    }
    .links-desktop {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      color: white;
      font-size: 0.88rem;
      font-weight: 600;
    }

    /* Mobile Screen */
    .mobile-shell {
      background: #ffffff;
      border: 8px solid #0f172a;
      border-radius: 40px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }
    .nav-mobile {
      background: #009ee3;
      padding: 0.75rem 1rem 0.85rem 1rem;
    }
    .nav-mobile-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .search-mobile {
      background: white;
      border-radius: 20px;
      padding: 8px 14px;
      font-size: 0.82rem;
      color: #94a3b8;
      width: 100%;
    }

    /* Login Box */
    .login-box {
      margin: 2rem auto;
      max-width: 380px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
    }
    .input-mock {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 10px;
      text-align: left;
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .btn-mock {
      background: #009ee3;
      color: white;
      border-radius: 8px;
      padding: 10px;
      font-weight: 700;
      margin-top: 1rem;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Implementación Oficial: Turnos Ya (Opción 1A)</h1>
    <p>Visualización del nuevo imagotipo tipográfico integrado en entornos de producción (Desktop Navbar, Mobile Web y Pantallas de Login)</p>
  </div>

  <div class="grid">
    <!-- Desktop Column -->
    <div>
      <div class="desktop-card">
        <div style="background: #0f172a; padding: 6px 12px; display: flex; gap: 6px;">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444; display: inline-block;"></span>
          <span style="width: 10px; height: 10px; border-radius: 50%; background: #f59e0b; display: inline-block;"></span>
          <span style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
        </div>

        <div class="nav-desktop">
          ${renderBadge('white', 26)}
          <div class="search-desktop">🔍 Buscar negocios o servicios...</div>
          <div class="links-desktop">
            <span>Mis Turnos</span>
            <span>Mi Panel</span>
            <span>🔔</span>
            <span style="background: white; color: #009ee3; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem;">JP</span>
            <span style="border: 1px solid rgba(255,255,255,0.4); padding: 4px 10px; border-radius: 6px; font-size: 0.8rem;">Salir</span>
          </div>
        </div>

        <div style="padding: 2rem;">
          <h3 style="font-size: 1.1rem; color: #0f172a; margin-bottom: 0.5rem;">Fondo Claro (Pantallas de Autenticación / Registro):</h3>
          <div class="login-box">
            <div style="margin-bottom: 1.25rem;">
              ${renderBadge('color', 36)}
            </div>
            <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem;">Iniciar sesión</h2>
            <p style="font-size: 0.82rem; margin-bottom: 1.25rem;">Ingresa tus credenciales para administrar tus turnos</p>
            <div class="input-mock">tucorreo@ejemplo.com</div>
            <div class="input-mock">••••••••••••</div>
            <div class="btn-mock">Ingresar a Turnos Ya</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Column -->
    <div>
      <div class="mobile-shell">
        <div style="background: #0f172a; padding: 6px; display: flex; justify-content: center;">
          <span style="width: 60px; height: 4px; background: #334155; border-radius: 4px; display: inline-block;"></span>
        </div>

        <div class="nav-mobile">
          <div class="nav-mobile-top">
            ${renderBadge('white', 22)}
            <div style="display: flex; gap: 8px; align-items: center; color: white; font-size: 0.8rem;">
              <span>🔔</span>
              <span style="background: rgba(255,255,255,0.25); color: white; padding: 2px 7px; border-radius: 12px; font-weight: 700; font-size: 0.75rem;">JP</span>
              <span style="border: 1px solid rgba(255,255,255,0.4); padding: 2px 6px; border-radius: 6px; font-size: 0.72rem;">Salir</span>
            </div>
          </div>
          <div class="search-mobile">🔍 Buscar negocios...</div>
        </div>

        <div style="padding: 1.5rem; text-align: center; color: #64748b; font-size: 0.85rem; min-height: 400px; background: #f8fafc;">
          <div style="margin-top: 2rem; padding: 1.5rem; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Espacio 100% Optimizado</div>
            <p style="font-size: 0.8rem; line-height: 1.4;">
              El logo ocupa solo 22px de alto. No empuja la barra de búsqueda y no choca contra los botones superiores.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('Turnos_ya_frontend_web-main/public/final-preview.html', html);
console.log('Final preview HTML generated!');

