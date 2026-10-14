const lockdownKit = require('@legendscribe/lockdown-kit-eslint-plugin').default;
const { configFlatConfigBroker } = require('@legendscribe/lockdown-kit-eslint-plugin');
// Assayer's own local rules — this repo's value contracts mean nothing to any other project, so they
// cannot live in @legendscribe/lockdown-kit-eslint-plugin. See eslint-rules/index.js.
const assayerLocalRules = require('./eslint-rules');

module.exports = [
    ...configFlatConfigBroker({
        startDir: __dirname,
        plugin: lockdownKit,
        prettier: true,
        jest: true,
        javascript: true,
    }),
    {
        // Repo-private rule: it names assayer's own value contracts, so it cannot ship in the plugin.
        files: ['**/*.ts', '**/*.tsx'],
        plugins: { '@assayer': assayerLocalRules },
        rules: { '@assayer/no-nullish-coalescing-on-arrange-value': 'error' },
    },
    {
        // manual-smoke-repo is fixture INPUT for Assayer's own compiler (a plain TS repo it analyzes).
        ignores: ['manual-smoke-repo/**'],
    },
    {
        // smoke-repo/ holds generated specimens, consumer code Assayer analyzes, for the same reason.
        ignores: ['smoke-repo/**'],
    },
    {
        // eslint-rules/ is Assayer's own local ESLint plugin; a lint rule fits no lockdown-kit folder type.
        ignores: ['eslint-rules/**'],
    },
    {
        // The specimen generator's declarations are consumer-shaped code with holes the rules forbid;
        // the generator typechecks every declaration itself when it loads them.
        ignores: ['packages/specimen-generator/declarations/**'],
    },
    {
        // Declaration files and hand-written type stubs sit outside every folder type.
        ignores: ['**/*.d.ts', '**/@types/**'],
    },
    {
        // Jest manual mocks are not folder-typed source.
        ignores: ['**/__mocks__/**'],
    },
];
