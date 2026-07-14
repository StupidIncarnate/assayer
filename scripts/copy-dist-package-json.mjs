// `tsc --build` never emits a package.json into a package's dist/, but the built CLI reads one at
// runtime: packageJsonReadAdapter resolves `<pkg>/dist/package.json` (four levels up from the compiled
// adapter) to print `assayer --version`. Nothing else in the pipeline creates it, so a clean build
// (`rm -rf packages/*/dist && npm run build`) would otherwise leave the CLI throwing ENOENT. Copy each
// package's package.json into its dist/ so a from-scratch build produces a runnable CLI.
import { readdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const packagesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages');

for (const pkg of readdirSync(packagesDir)) {
  const source = join(packagesDir, pkg, 'package.json');
  const distDir = join(packagesDir, pkg, 'dist');
  if (existsSync(source) && existsSync(distDir)) {
    copyFileSync(source, join(distDir, 'package.json'));
  }
}
