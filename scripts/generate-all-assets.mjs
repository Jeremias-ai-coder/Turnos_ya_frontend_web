import fs from 'fs';
import path from 'path';

const brandWebDir = path.resolve('Turnos_ya_frontend_web-main/public/assets/brand');
const publicDir = path.resolve('Turnos_ya_frontend_web-main/public');
const brandMobileDir = path.resolve('Turnos_ya_frontend_mobile-main/assets/brand');

// Full Typographic Logo SVG with Speed-Badge
function getLogoSvg(colorMode = 'white', width = 250, height = 56) {
  const isWhite = colorMode === 'white';
  const textTurnos = isWhite ? '#ffffff' : '#0f172a';
  const badgeBg = isWhite ? '#ffffff' : '#009ee3';
  const badgeText = isWhite ? '#009ee3' : '#ffffff';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 54" width="${width}" height="${height}" fill="none">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800;900&amp;display=swap');
      .txt-turnos {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        font-size: 32px;
        font-weight: 800;
        letter-spacing: -0.8px;
      }
      .txt-ya {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        font-size: 26px;
        font-weight: 900;
        letter-spacing: -0.3px;
      }
    </style>
    <filter id="badge-shadow-${colorMode}" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="${isWhite ? '0.12' : '0.18'}" />
    </filter>
  </defs>

  <!-- Text: Turnos -->
  <text x="6" y="38" class="txt-turnos" fill="${textTurnos}">Turnos</text>

  <!-- Speed Badge Capsule -->
  <g transform="translate(138, 10)">
    <!-- Skewed Badge Background -->
    <rect x="0" y="0" width="86" height="34" rx="9" fill="${badgeBg}" transform="skewX(-10)" filter="url(#badge-shadow-${colorMode})" />

    <!-- Unskewed Content Inside Badge -->
    <g transform="translate(10, 0)">
      <text x="5" y="25" class="txt-ya" fill="${badgeText}">Ya</text>
      <!-- Checkmark -->
      <polyline points="48,12 55,21 68,9" stroke="${badgeText}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;
}

// Standalone Speed-Badge Icon (Icon / Favicon / App Icon)
function getIconSvg(colorMode = 'white', size = 64) {
  const isWhite = colorMode === 'white';
  const bg = isWhite ? '#009ee3' : '#ffffff';
  const badgeBg = isWhite ? '#ffffff' : '#009ee3';
  const badgeText = isWhite ? '#009ee3' : '#ffffff';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@900&amp;display=swap');
      .txt-badge-icon {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        font-size: 20px;
        font-weight: 900;
      }
    </style>
  </defs>

  <!-- Squircle Base -->
  <rect width="64" height="64" rx="16" fill="${bg}" ${!isWhite ? 'stroke="#e2e8f0" stroke-width="1.5"' : ''} />

  <!-- Centered Skewed Badge -->
  <g transform="translate(9, 16)">
    <rect x="0" y="0" width="46" height="32" rx="8" fill="${badgeBg}" transform="skewX(-8)" />
    <g transform="translate(3, 0)">
      <text x="2" y="23" class="txt-badge-icon" fill="${badgeText}">Ya</text>
      <polyline points="26,12 31,19 40,8" stroke="${badgeText}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;
}

// Favicon SVG (Dedicated 32x32 / 64x64 browser tab icon)
function getFaviconSvg() {
  return getIconSvg('white', 64);
}

console.log('Writing production Speed-Badge brand assets...');

fs.writeFileSync(path.join(brandWebDir, 'logo-white.svg'), getLogoSvg('white', 240, 54));
fs.writeFileSync(path.join(brandWebDir, 'logo-color.svg'), getLogoSvg('color', 240, 54));
fs.writeFileSync(path.join(brandWebDir, 'icon-white.svg'), getIconSvg('white', 64));
fs.writeFileSync(path.join(brandWebDir, 'icon-color.svg'), getIconSvg('color', 64));
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), getFaviconSvg());

if (fs.existsSync(brandMobileDir)) {
  fs.writeFileSync(path.join(brandMobileDir, 'logo-white.svg'), getLogoSvg('white', 240, 54));
  fs.writeFileSync(path.join(brandMobileDir, 'logo-color.svg'), getLogoSvg('color', 240, 54));
  fs.writeFileSync(path.join(brandMobileDir, 'icon-white.svg'), getIconSvg('white', 64));
  fs.writeFileSync(path.join(brandMobileDir, 'icon-color.svg'), getIconSvg('color', 64));
}

console.log('Speed-Badge brand assets successfully created!');
