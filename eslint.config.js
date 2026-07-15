const dungeonmaster = require('@dungeonmaster/eslint-plugin').default;
const tsparser = require('@typescript-eslint/parser');
const dungeonmasterConfigs = dungeonmaster.configs.dungeonmaster;
const dungeonmasterTestConfigs = dungeonmaster.configs.dungeonmasterTest;

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
        },
        rules: {...dungeonmasterConfigs.typescript.rules},
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
        },
        rules: {
            ...dungeonmasterTestConfigs.test.rules,
            // `jest/prefer-to-be` and `@dungeonmaster/ban-weak-existence-matchers` are both `error`
            // in the shared test config and want opposite things: the former AUTOFIXES
            // `toBe(undefined)` into `toBeUndefined()`, which the latter then rejects. Together they
            // make asserting undefined unrepresentable — every spelling is an error, and --fix loops.
            // ban-weak-existence-matchers wins because it is the standard the codebase is written to
            // (`toBe(undefined)` throughout @dungeonmaster). Reported in plan/scaffolding-doc-gaps.md.
            'jest/prefer-to-be': 'off',
        },
    },
    ...dungeonmasterTestConfigs.fileOverrides,
];
