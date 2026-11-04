import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const brandWebDir = path.resolve('Turnos_ya_frontend_web-main/public/assets/brand');
const publicDir = path.resolve('Turnos_ya_frontend_web-main/public');
const brandMobileDir = path.resolve('Turnos_ya_frontend_mobile-main/assets/brand');
const mobileAssetsDir = path.resolve('Turnos_ya_frontend_mobile-main/assets');

// Clean SVG Isotype Generator
function getIsotypeSvg(colorMode = 'white', width = 100, height = 100) {
  const isWhite = colorMode === 'white';
  const mainStroke = isWhite ? '#ffffff' : '#0f172a';
  const accentColor = isWhite ? '#ffffff' : '#009ee3';
  const gridColor = isWhite ? 'rgba(255, 255, 255, 0.65)' : 'rgba(15, 23, 42, 0.2)';
  const bodyFill = isWhite ? 'rgba(255, 255, 255, 0.12)' : '#ffffff';

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

// Full Horizontal Logo SVG
function getFullLogoSvg(colorMode = 'white', width = 320, height = 80) {
  const isWhite = colorMode === 'white';
  const textColorTurnos = isWhite ? '#ffffff' : '#0f172a';
  const textColorYa = isWhite ? '#ffffff' : '#009ee3';

  const isotype = getIsotypeSvg(colorMode, 64, 64);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="${width}" height="${height}" fill="none">
  <!-- Isotipo -->
  <g transform="translate(6, 8)">
    ${isotype.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="64" height="64" fill="none">', '').replace('</svg>', '')}
  </g>

  <!-- Text: Turnos -->
  <text x="106" y="54" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="38" font-weight="800" letter-spacing="-0.5" fill="${textColorTurnos}">Turnos</text>

  <!-- Text: Ya -->
  <text x="246" y="54" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="38" font-weight="900" letter-spacing="-0.3" fill="${textColorYa}">Ya</text>
</svg>`;
}

// Favicon SVG (Solid primary background with white isotype)
function getFaviconSvg() {
  const isotypeInner = getIsotypeSvg('white', 100, 100)
    .replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" fill="none">', '')
    .replace('</svg>', '');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <rect width="64" height="64" rx="16" fill="#009ee3" />
  <g transform="translate(8, 8) scale(0.48)">
    ${isotypeInner}
  </g>
</svg>`;
}

console.log('Writing vector SVG files...');

// 1. Write vector SVGs
fs.writeFileSync(path.join(brandWebDir, 'icon-white.svg'), getIsotypeSvg('white', 100, 100));
fs.writeFileSync(path.join(brandWebDir, 'icon-color.svg'), getIsotypeSvg('color', 100, 100));
fs.writeFileSync(path.join(brandWebDir, 'logo-white.svg'), getFullLogoSvg('white', 320, 80));
fs.writeFileSync(path.join(brandWebDir, 'logo-color.svg'), getFullLogoSvg('color', 320, 80));
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), getFaviconSvg());

// Also copy to mobile assets if folder exists
if (fs.existsSync(brandMobileDir)) {
  fs.writeFileSync(path.join(brandMobileDir, 'icon-white.svg'), getIsotypeSvg('white', 100, 100));
  fs.writeFileSync(path.join(brandMobileDir, 'icon-color.svg'), getIsotypeSvg('color', 100, 100));
  fs.writeFileSync(path.join(brandMobileDir, 'logo-white.svg'), getFullLogoSvg('white', 320, 80));
  fs.writeFileSync(path.join(brandMobileDir, 'logo-color.svg'), getFullLogoSvg('color', 320, 80));
}

console.log('All vector SVG assets written successfully!');
