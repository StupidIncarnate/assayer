const lockdownKit = require('@legendscribe/lockdown-kit-eslint-plugin').default;
const {
    configLockdownKitBroker,
    configArchitectureOverridesBroker,
    configGatewayLintConfigBroker,
    configWorkspacePackageNamesBroker,
    configPackagePrefixBroker,
} = require('@legendscribe/lockdown-kit-eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const { gatewayLocationsStatics } = require('@legendscribe/lockdown-kit-shared/statics');

const architectureOverrides = configArchitectureOverridesBroker({ startDir: __dirname });
const gatewayLintConfig = configGatewayLintConfigBroker({ startDir: __dirname });
const workspacePackageNames = configWorkspacePackageNamesBroker({ startDir: __dirname });
const packagePrefix = configPackagePrefixBroker({ startDir: __dirname });
const lockdownKitConfigs = configLockdownKitBroker({
    architectureOverrides,
    gatewayLintConfig,
    workspacePackageNames,
    packagePrefix,
});
const lockdownKitTestConfigs = configLockdownKitBroker({
    forTesting: true,
    architectureOverrides,
    gatewayLintConfig,
    workspacePackageNames,
    packagePrefix,
});
// Assayer's own local rules — this repo's value contracts mean nothing to any other project, so they
// cannot live in @legendscribe/lockdown-kit-eslint-plugin. See eslint-rules/index.js.
const assayerLocalRules = require('./eslint-rules');

module.exports = [
    {
        // Framework/build artifacts that live outside the lockdown-kit folder-type
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
            // it analyzes), NOT lockdown-kit-standards code — exclude it from lint.
            'manual-smoke-repo/**',
            // smoke-repo/ holds generated specimens, consumer code Assayer analyzes, for the same reason.
            'smoke-repo/**',
            // eslint-rules/ holds Assayer's own local ESLint plugin. A lint rule fits none
            // of the lockdown-kit folder types, so it lives outside packages/*/src and is
            // excluded here for the same reason manual-smoke-repo is: linting it under the
            // lockdown-kit ruleset would fail enforce-project-structure.
            'eslint-rules/**',
            // The specimen generator's declarations are consumer-shaped code with holes: classes whose
            // methods ignore `this`, generators, unnamed functions. The rules forbid the shapes these
            // files exist to show. The generator typechecks every declaration itself when it loads them.
            'packages/specimen-generator/declarations/**',
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
            ...lockdownKitConfigs.typescript.plugins,
            '@legendscribe/lockdown-kit': lockdownKit,
            '@assayer': assayerLocalRules,
        },
        rules: {
            ...lockdownKitConfigs.typescript.rules,
            '@assayer/no-nullish-coalescing-on-arrange-value': 'error',
        },
    },
    {
        files: lockdownKitConfigs.gateway.files,
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
            ...lockdownKitConfigs.gateway.plugins,
            '@legendscribe/lockdown-kit': lockdownKit,
        },
        rules: {
            ...lockdownKitConfigs.gateway.rules,
        },
    },
    ...lockdownKitConfigs.fileOverrides,
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
            ...lockdownKitTestConfigs.test.plugins,
            '@legendscribe/lockdown-kit': lockdownKit,
            '@assayer': assayerLocalRules,
        },
        rules: {
            ...lockdownKitTestConfigs.test.rules,
            '@assayer/no-nullish-coalescing-on-arrange-value': 'error',
        },
    },
    ...lockdownKitTestConfigs.fileOverrides,
];
