import fs from 'fs';

function updateFile(filePath, transforms) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const { search, replace } of transforms) {
    if (typeof search === 'string') {
      if (!content.includes(search)) {
        console.warn(`Warning: Could not find substring in ${filePath}:\n${search}`);
      } else {
        content = content.replace(search, replace);
      }
    } else if (search instanceof RegExp) {
      if (!search.test(content)) {
        console.warn(`Warning: Regex did not match in ${filePath}:\n${search}`);
      } else {
        content = content.replace(search, replace);
      }
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated: ${filePath}`);
}

// 1. Login.tsx
updateFile('Turnos_ya_frontend_web-main/src/pages/Login.tsx', [
  {
    search: "import LoadingSpinner from '../components/common/LoadingSpinner';",
    replace: "import LoadingSpinner from '../components/common/LoadingSpinner';\nimport { BrandLogo } from '../components/common/BrandLogo';"
  }
]);

// 2. RecoverPassword.tsx
updateFile('Turnos_ya_frontend_web-main/src/pages/RecoverPassword.tsx', [
  {
    search: "import LoadingSpinner from '../components/common/LoadingSpinner';",
    replace: "import LoadingSpinner from '../components/common/LoadingSpinner';\nimport { BrandLogo } from '../components/common/BrandLogo';"
  }
]);

// 3. ResetPassword.tsx
updateFile('Turnos_ya_frontend_web-main/src/pages/ResetPassword.tsx', [
  {
    search: "import LoadingSpinner from '../components/common/LoadingSpinner';",
    replace: "import LoadingSpinner from '../components/common/LoadingSpinner';\nimport { BrandLogo } from '../components/common/BrandLogo';"
  }
]);

console.log('Imports updated successfully!');
