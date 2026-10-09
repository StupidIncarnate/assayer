const dungeonmasterPluginModule = require('@dungeonmaster/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const { gatewayLocationsStatics } = require('@dungeonmaster/shared/statics');

const dungeonmaster = dungeonmasterPluginModule.default;
const { configGatewayLintConfigBroker, configWorkspacePackageNamesBroker } = dungeonmasterPluginModule;
const gatewayLintConfig = configGatewayLintConfigBroker({ startDir: __dirname });
const workspacePackageNames = configWorkspacePackageNamesBroker({ startDir: __dirname });
// The plugin's prebuilt `configs.dungeonmaster` has an empty gateway config and an empty workspace
// list, so `ban-workspace-export-mocks` would check nothing. Building the configs here fills both.
const dungeonmasterConfigs = dungeonmasterPluginModule.configDungeonmasterBroker({
    gatewayLintConfig,
    workspacePackageNames,
});
const dungeonmasterTestConfigs = dungeonmasterPluginModule.configDungeonmasterBroker({
    forTesting: true,
    gatewayLintConfig,
    workspacePackageNames,
});
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
            // manual-smoke-repo is fixture INPUT for Assayer's own compiler (a plain TS repo
            // it analyzes), NOT dungeonmaster-standards code — exclude it from lint.
            'manual-smoke-repo/**',
            // smoke-repo/ holds generated specimens, consumer code Assayer analyzes, for the same reason.
            'smoke-repo/**',
            // eslint-rules/ holds Assayer's own local ESLint plugin. A lint rule fits none
            // of the dungeonmaster folder types, so it lives outside packages/*/src and is
            // excluded here for the same reason manual-smoke-repo is: linting it under the
            // dungeonmaster ruleset would fail enforce-project-structure.
            'eslint-rules/**',
        ],
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        // Gateway source gets the gateway block below instead of this block's rules.
        ignores: ['**/*.test.ts', '**/*.test.tsx', ...gatewayLocationsStatics.packageGlobs],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                // Each file is typed against its nearest tsconfig.json, its own package's, so files under
                // a package's test/ and bin/ folders are linted too.
                project: true,
                tsconfigRootDir: __dirname,
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
    {
        files: dungeonmasterConfigs.gateway.files,
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                // The root tsconfig does not include gateway source. `project: true` makes each
                // gateway file use the nearest tsconfig.json, which is its own package's.
                project: true,
                tsconfigRootDir: __dirname,
            },
        },
        plugins: {
            ...dungeonmasterConfigs.gateway.plugins,
            '@dungeonmaster': dungeonmaster,
        },
        rules: {
            ...dungeonmasterConfigs.gateway.rules,
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
                // Each file is typed against its nearest tsconfig.json, its own package's, so files under
                // a package's test/ and bin/ folders are linted too.
                project: true,
                tsconfigRootDir: __dirname,
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
];
