const dungeonmaster = require('@dungeonmaster/eslint-plugin').default;
const tsparser = require('@typescript-eslint/parser');
const dungeonmasterConfigs = dungeonmaster.configs.dungeonmaster;
const dungeonmasterTestConfigs = dungeonmaster.configs.dungeonmasterTest;

module.exports = [
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
