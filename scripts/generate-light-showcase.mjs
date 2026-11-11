import fs from 'fs';
import { execSync } from 'child_process';

// We import the functions by evaluating or defining
const fileContent = fs.readFileSync('Turnos_ya_frontend_web-main/scripts/generate-proposals.mjs', 'utf8');

// Replace html definition to use light theme and colorMode = 'color'
let lightScript = fileContent
  .replace("background: #009ee3;\n      color: white;", "background: #f8fafc;\n      color: #0f172a;")
  .replace("color: white;\n      padding: 3rem 2.5rem;", "color: #0f172a;\n      padding: 3rem 2.5rem;")
  .replace("background: rgba(255, 255, 255, 0.14);\n      border: 1.5px solid rgba(255, 255, 255, 0.28);", "background: #ffffff;\n      border: 1.5px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.06);")
  .replace("background: #009ee3;\n      border: 1px solid rgba(255, 255, 255, 0.35);", "background: #f0f9ff;\n      border: 1px solid #bae6fd;")
  .replace("background: rgba(0, 0, 0, 0.15);", "background: #f1f5f9; border: 1px solid #e2e8f0;")
  .replace("color: #94a3b8;", "color: #64748b; border: 1px solid #cbd5e1;")
  .replace("border-top: 1px solid rgba(255, 255, 255, 0.2);", "border-top: 1px solid #e2e8f0;")
  .replace("background: white;\n      color: #009ee3;", "background: #009ee3;\n      color: white;")
  .replaceAll("${getProposal1('white'", "${getProposal1('color'")
  .replaceAll("${getProposal2('white'", "${getProposal2('color'")
  .replaceAll("${getProposal3('white'", "${getProposal3('color'")
  .replaceAll("${getProposal4('white'", "${getProposal4('color'")
  .replace("fs.writeFileSync('Turnos_ya_frontend_web-main/public/proposals-showcase.html', html);", "fs.writeFileSync('Turnos_ya_frontend_web-main/public/proposals-showcase-light.html', html);");

fs.writeFileSync('Turnos_ya_frontend_web-main/scripts/run-light-showcase.mjs', lightScript);
