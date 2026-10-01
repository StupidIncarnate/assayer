const path = require('path');
const dungeonmasterPluginModule = require('@dungeonmaster/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const { gatewayLocationsStatics } = require('@dungeonmaster/shared/statics');

const dungeonmaster = dungeonmasterPluginModule.default;
// The plugin's `exports` map has no key for these two brokers, so they are required from its `dist`
// by path. Both get `startDir: __dirname`, assayer's root. Left to find the root on their own, they
// would walk up from the plugin's folder, which is a `file:` link into the dungeonmaster checkout,
// and read that repo's `.dungeonmaster.json` and workspaces.
const pluginDist = path.join(__dirname, 'node_modules/@dungeonmaster/eslint-plugin/dist');
const { configGatewayLintConfigBroker } = require(
    path.join(pluginDist, 'brokers/config/gateway-lint-config/config-gateway-lint-config-broker.js'),
);
const { configWorkspacePackageNamesBroker } = require(
    path.join(pluginDist, 'brokers/config/workspace-package-names/config-workspace-package-names-broker.js'),
);
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
    {
        // Without a `scope` option these rules find the repo scope by walking up from the plugin's own
        // folder. The plugin is a `file:` link into the dungeonmaster checkout, so that walk finds
        // `@dungeonmaster` and every `@assayer/*` workspace import reads as a raw npm import.
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            '@dungeonmaster/raw-import-ban': ['error', { scope: '@assayer' }],
            '@dungeonmaster/bin-program-spawn-ban': ['error', { scope: '@assayer' }],
        },
    },
    {
        // `gateway-import-boundary` needs the same `scope` option for the same reason. Only the
        // gateway block turns this rule on, so this entry uses the gateway globs. On `**/*.ts` it
        // would switch the rule on in every package. The parser options repeat the gateway block's,
        // because the test block above sets the root tsconfig, which never includes gateway files.
        files: dungeonmasterConfigs.gateway.files,
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: __dirname,
            },
        },
        rules: {
            '@dungeonmaster/gateway-import-boundary': ['error', { scope: '@assayer' }],
        },
    },
];
