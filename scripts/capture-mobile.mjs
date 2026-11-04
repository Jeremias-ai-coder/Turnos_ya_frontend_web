import fs from 'fs';

// Let's create an exact HTML representation of the navbar at mobile width (375px)
const svgHero = fs.readFileSync('Turnos_ya_frontend_web-main/public/assets/brand/icon-white.svg', 'utf8')
  .replace(/width="[^"]*"/, 'width="30"')
  .replace(/height="[^"]*"/, 'height="30"');

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #f1f5f9;
      font-family: 'Plus Jakarta Sans', sans-serif;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      align-items: center;
    }
    .mobile-screen {
      width: 375px;
      background: #ffffff;
      border: 8px solid #1e293b;
      border-radius: 36px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }
    .navbar {
      background-color: #009ee3;
      padding: 0.75rem 1rem 0.85rem 1rem;
    }
    .navbar-row1 {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: white;
      line-height: 1;
    }
    .brand-text {
      font-size: 1.18rem;
      font-weight: 800;
      letter-spacing: -0.4px;
    }
    .brand-text span {
      font-weight: 900;
      margin-left: 1px;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 10px;
      color: white;
      font-size: 0.85rem;
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: white;
      color: #009ee3;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
    }
    .search-input {
      width: 100%;
      background: white;
      border: none;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 0.85rem;
      color: #64748b;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
  </style>
</head>
<body>
  <div class="mobile-screen">
    <div class="navbar">
      <div class="navbar-row1">
        <div class="brand">
          ${svgHero}
          <div class="brand-text">Turnos<span>Ya</span></div>
        </div>
        <div class="actions">
          <span>🔔</span>
          <div class="avatar">JP</div>
          <span style="font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.4); padding: 4px 8px; border-radius: 6px;">Salir</span>
        </div>
      </div>
      <input class="search-input" placeholder="Buscar negocios o servicios..." readonly />
    </div>
    <div style="padding: 1.5rem; color: #64748b; font-size: 0.9rem; text-align: center;">
      Vista previa del Header en pantalla móvil (375px)
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('Turnos_ya_frontend_web-main/public/mobile-preview.html', html);

