// PE-9 step 8 (concession 15, as extended for PE-9). The specimen catalogue's tests walk each specimen with
// `walkFileTransformer({ source, relPath })` or `analyzeExtractBroker({ source, relPath })`. Neither call carries
// the specimen's absolute path, so the analyzer cannot find the tsconfig that owns it. This script adds ONE argument
// to each call, `absPath`, set to the very path expression the test already reads the source from
// (`readFileSync(<path>, 'utf8')`), and changes ONE import name: the walk import becomes
// `fileWalkBroker as walkFileTransformer`, the broker that looks the owner up before walking. It also points the
// specimen tsconfig's `@assayer/core/walk-file` path at that broker. Nothing else in a test file changes, and no
// specimen SOURCE file is touched.
//
// Usage: node scrolls/brands-gateways-epic/scripts/pe-9-abspath/abspath.cjs [apply]
// Dry run unless the bare word `apply` is given. Prints every call it cannot rewrite as a leftover and rewrites
// nothing in that file.
const fs = require('fs');
const path = require('path');

const REPO = '/home/brutus-home/projects/assayer';
const PACKAGE = `${REPO}/smoke-repo/packages/syntax-repository`;
const SRC = `${PACKAGE}/src`;
const TSCONFIG = `${PACKAGE}/tsconfig.json`;
const CALL = /(walkFileTransformer|analyzeExtractBroker)\(\{([^{}]*)\}\)/gu;
const WALK_IMPORT = "import { walkFileTransformer } from '@assayer/core/walk-file';";
const BROKER_IMPORT = "import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';";
const OLD_PATH = '"../../../packages/core/src/transformers/walk-file/walk-file-transformer"';
const NEW_PATH = '"../../../packages/core/src/brokers/file/walk/file-walk-broker"';

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : /\.test\.tsx?$/u.test(entry.name) ? [full] : [];
  });

const apply = process.argv.includes('apply');
const leftovers = [];
const changed = [];
let sites = 0;

walk(SRC).forEach((file) => {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(PACKAGE, file);
  const fileLeftovers = [];
  let fileSites = 0;

  const rewritten = text.replace(CALL, (whole, name, args) => {
    if (/\babsPath\b/u.test(args)) {
      return whole;
    }
    const sourceArg = /\bsource(?:\s*:\s*([A-Za-z_$][\w$]*))?/u.exec(args);
    const variable = sourceArg === null ? undefined : sourceArg[1] ?? 'source';
    const definitions =
      variable === undefined
        ? []
        : [...text.matchAll(new RegExp(`const ${variable}\\s*=\\s*readFileSync\\(([^,]+(?:\\([^)]*\\))?[^,]*),\\s*'utf8'\\)`, 'gu'))];

    if (definitions.length !== 1) {
      fileLeftovers.push(`${rel}: ${name}({${args.trim()}}) — source variable ${String(variable)} has ${definitions.length} readFileSync definitions`);
      return whole;
    }

    fileSites += 1;
    return `${name}({${args.replace(/\s*$/u, '')}, absPath: ${definitions[0][1].trim()} })`.replace(/\{\s+/u, '{ ');
  });

  const withImport = rewritten.includes(WALK_IMPORT) ? rewritten.replace(WALK_IMPORT, BROKER_IMPORT) : rewritten;

  if (fileLeftovers.length > 0) {
    leftovers.push(...fileLeftovers);
    return;
  }
  if (withImport !== text) {
    sites += fileSites;
    changed.push(`${rel} (${fileSites})`);
    if (apply) fs.writeFileSync(file, withImport);
  }
});

const tsconfig = fs.readFileSync(TSCONFIG, 'utf8');
const tsconfigChanges = tsconfig.includes(OLD_PATH) ? 1 : 0;
if (apply && tsconfigChanges === 1) fs.writeFileSync(TSCONFIG, tsconfig.replace(OLD_PATH, NEW_PATH));

console.log(`${apply ? 'APPLIED' : 'DRY RUN'}: ${changed.length} test files, ${sites} calls; tsconfig paths entry: ${tsconfigChanges}`);
changed.forEach((line) => console.log(`  ${line}`));
console.log(`leftovers: ${leftovers.length}`);
leftovers.forEach((line) => console.log(`  ${line}`));
