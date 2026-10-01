const dungeonmaster = require('@dungeonmaster/eslint-plugin').default;
const tsparser = require('@typescript-eslint/parser');
const dungeonmasterConfigs = dungeonmaster.configs.dungeonmaster;
const dungeonmasterTestConfigs = dungeonmaster.configs.dungeonmasterTest;
// Assayer's own local rules — this repo's value contracts mean nothing to any other project, so they
// cannot live in @dungeonmaster/eslint-plugin. See eslint-rules/index.js.
const assayerLocalRules = require('./eslint-rules');

module.exports = [
    {
        // Framework/build artifacts that live outside the dungeonmaster folder-type
        // system (bundler configs, compiled output). Linting these would fail the
        // enforce-project-structure rule and typed-lint project resolution.
        ignores: [
            '**/dist/**',
            '**/*.config.ts',
            '**/*.config.js',
            '**/*.d.ts',
            '**/@types/**',
            '**/__mocks__/**',
            // smoke-repo is fixture INPUT for Assayer's own compiler (a plain TS repo
            // it analyzes), NOT dungeonmaster-standards code — exclude it from lint.
            'smoke-repo/**',
            // eslint-rules/ holds Assayer's own local ESLint plugin. A lint rule fits none
            // of the dungeonmaster folder types, so it lives outside packages/*/src and is
            // excluded here for the same reason smoke-repo is: linting it under the
            // dungeonmaster ruleset would fail enforce-project-structure.
            'eslint-rules/**',
        ],
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        ignores: ['**/*.test.ts', '**/*.test.tsx'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: './tsconfig.json',
            },
        },
        plugins: {
            ...dungeonmasterConfigs.typescript.plugins,
            '@dungeonmaster': dungeonmaster,
            '@assayer': assayerLocalRules,
        },
        rules: {
            ...dungeonmasterConfigs.typescript.rules,
            '@assayer/no-nullish-coalescing-on-arrange-value': 'error',
        },
    },
    ...dungeonmasterConfigs.fileOverrides,
    {
        files: ['**/*.test.ts', '**/*.test.tsx'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: './tsconfig.json',
            },
        },
        plugins: {
            ...dungeonmasterTestConfigs.test.plugins,
            '@dungeonmaster': dungeonmaster,
            '@assayer': assayerLocalRules,
        },
        rules: {
            ...dungeonmasterTestConfigs.test.rules,
            '@assayer/no-nullish-coalescing-on-arrange-value': 'error',
        },
    },
    ...dungeonmasterTestConfigs.fileOverrides,
    {
        // These three brand rules autofix under ward's `--fix`. They stay off repo-wide until the
        // brands-gateways epic's brand waves add every brand in order (EPIC item B-9 turns them on).
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            '@dungeonmaster/require-object-contract-brands': 'off',
            '@dungeonmaster/require-object-contract-brands-indexed': 'off',
            '@dungeonmaster/enforce-owner-field-reuse': 'off',
        },
    },
];
