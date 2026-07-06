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
            '**/bin/**',
            '**/*.config.ts',
            '**/*.config.js',
            '**/*.d.ts',
            '**/@types/**',
            '**/__mocks__/**',
            '**/src/main.tsx',
            '**/startup/desktop-main.ts',
            '**/startup/desktop-preload.ts',
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
        rules: {...dungeonmasterTestConfigs.test.rules},
    },
    ...dungeonmasterTestConfigs.fileOverrides,
];
