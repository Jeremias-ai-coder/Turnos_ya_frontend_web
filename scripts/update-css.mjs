import fs from 'fs';

let css = fs.readFileSync('Turnos_ya_frontend_web-main/src/styles/global.css', 'utf8');

// Replace desktop brand styles
const targetDesktop = `.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  text-decoration: none;
  color: white;
  font-weight: 800;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.brand-logo-nav {
  height: 38px;
  max-width: 155px;
  object-fit: contain;
  display: block;
  transition: transform 0.2s ease;
}

.brand-logo-nav:hover {
  transform: scale(1.02);
}`;

const replacementDesktop = `.navbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  text-decoration: none;
  color: white;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
}

.navbar-brand:hover {
  opacity: 0.95;
}

.navbar-brand:hover .brand-logo-icon {
  transform: translateY(-1px) scale(1.04);
}

.brand-logo-component {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.brand-logo-icon {
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.brand-logo-nav {
  height: 38px;
  max-width: 155px;
  object-fit: contain;
  display: block;
  transition: transform 0.2s ease;
}

.brand-logo-nav:hover {
  transform: scale(1.02);
}`;

// Normalize line endings for replacement
const normalize = str => str.replace(/\r\n/g, '\n');

let normalizedCss = normalize(css);
if (normalizedCss.includes(normalize(targetDesktop))) {
  normalizedCss = normalizedCss.replace(normalize(targetDesktop), normalize(replacementDesktop));
  console.log('Desktop brand styles updated');
} else {
  console.warn('Target desktop styles not found!');
}

const targetMobile = `  .navbar-inner {
    flex-wrap: wrap;
    gap: 0.6rem;
  }`;

const replacementMobile = `  .navbar-custom {
    padding: 0.75rem 0 0.85rem 0;
  }

  .navbar-inner {
    flex-wrap: wrap;
    gap: 0.75rem 0.6rem;
    align-items: center;
  }

  .navbar-brand {
    padding: 2px 0;
  }

  .brand-logo-component.brand-logo-md svg {
    width: 30px;
    height: 30px;
  }

  .brand-logo-component.brand-logo-md .brand-logo-text {
    font-size: 1.18rem !important;
  }`;

if (normalizedCss.includes(normalize(targetMobile))) {
  normalizedCss = normalizedCss.replace(normalize(targetMobile), normalize(replacementMobile));
  console.log('Mobile brand styles updated');
} else {
  console.warn('Target mobile styles not found!');
}

fs.writeFileSync('Turnos_ya_frontend_web-main/src/styles/global.css', normalizedCss, 'utf8');
console.log('Finished updating global.css');
