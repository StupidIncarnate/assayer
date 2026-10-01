// Finds the raw outside imports and platform globals the codemod can move. run.cjs sets A18_ROOT (the
// repo being rewritten) and A18_SCOPE (its npm scope) before ESLint loads this file.
const tsparser = require('@typescript-eslint/parser');
const dungeonmasterPlugin = require('@dungeonmaster/eslint-plugin').default;
const { gatewayLocationsStatics } = require('@dungeonmaster/shared/statics');

const root = process.env.A18_ROOT;
const scope = process.env.A18_SCOPE;
if (!root || !scope) {
  throw new Error('a18-census.config.js needs A18_ROOT and A18_SCOPE; run it through run.cjs');
}

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [...gatewayLocationsStatics.packageGlobs, '**/*.d.ts', '**/dist/**', '**/node_modules/**'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true }, project: true, tsconfigRootDir: root },
    },
    plugins: { '@dungeonmaster': dungeonmasterPlugin },
    rules: {
      // `scope` is passed because the rules otherwise look it up from the plugin's own folder, which
      // is a link into the dungeonmaster checkout.
      '@dungeonmaster/raw-import-ban': ['error', { scope }],
      '@dungeonmaster/platform-globals-ban': 'error',
      '@dungeonmaster/bin-program-spawn-ban': ['error', { scope }],
    },
  },
];
