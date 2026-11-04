import fs from 'fs';

const content = fs.readFileSync('Turnos_ya_frontend_web-main/scripts/test-check-arrow-variations.mjs', 'utf8');

const lightScript = content
  .replace("background: #009ee3;\n      color: white;", "background: #f8fafc;\n      color: #0f172a;")
  .replace("color: white;\n      padding: 3rem 2.5rem;", "color: #0f172a;\n      padding: 3rem 2.5rem;")
  .replace("h1 { font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; letter-spacing: -0.5px; }", "h1 { font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; letter-spacing: -0.5px; color: #0f172a; }")
  .replace("p.lead { font-size: 1rem; opacity: 0.92; line-height: 1.5; }", "p.lead { font-size: 1rem; color: #64748b; line-height: 1.5; }")
  .replace("background: rgba(255, 255, 255, 0.14);\n      border: 1.5px solid rgba(255, 255, 255, 0.28);", "background: #ffffff;\n      border: 1.5px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.06);")
  .replace("background: #009ee3;\n      border: 1px solid rgba(255, 255, 255, 0.35);", "background: #f0f9ff;\n      border: 1px solid #bae6fd;")
  .replace("background: rgba(0, 0, 0, 0.15);", "background: #f1f5f9; border: 1px solid #e2e8f0;")
  .replace("color: #94a3b8;", "color: #64748b; border: 1px solid #cbd5e1;")
  .replace("border-top: 1px solid rgba(255, 255, 255, 0.2);", "border-top: 1px solid #e2e8f0;")
  .replace("background: white;\n      color: #009ee3;", "background: #009ee3;\n      color: white;")
  .replaceAll("${getVar3A('white'", "${getVar3A('color'")
  .replaceAll("${getVar3B('white'", "${getVar3B('color'")
  .replaceAll("${getVar3C('white'", "${getVar3C('color'")
  .replaceAll("${getVar3D('white'", "${getVar3D('color'")
  .replace("fs.writeFileSync('Turnos_ya_frontend_web-main/public/check-arrow-showcase.html', html);", "fs.writeFileSync('Turnos_ya_frontend_web-main/public/check-arrow-showcase-light.html', html);");

fs.writeFileSync('Turnos_ya_frontend_web-main/scripts/run-check-light.mjs', lightScript);

