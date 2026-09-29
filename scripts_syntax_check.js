const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const files = [
  'middleware.ts',
  'lib/config.ts',
  'lib/google.ts',
  'lib/types.ts',
  'lib/vip-db.ts',
  'app/layout.tsx',
  'app/not-found.tsx',
  'app/login/page.tsx',
  'app/page.tsx',
  'app/api/login/route.ts',
  'app/api/logout/route.ts',
  'app/api/vip-notes/route.ts',
  'app/companies/[companyKey]/page.tsx',
  'app/companies/[companyKey]/notes/page.tsx',
];
let ok = true;
for (const file of files) {
  const full = path.join(process.cwd(), file);
  const source = fs.readFileSync(full, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      isolatedModules: true,
      strict: true,
    },
    fileName: full,
    reportDiagnostics: true,
  });
  if (result.diagnostics && result.diagnostics.length) {
    ok = false;
    console.log('FILE', file);
    for (const d of result.diagnostics) {
      console.log('  -', ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    }
  }
}
if (!ok) process.exit(1);
console.log('syntax_check_ok');
