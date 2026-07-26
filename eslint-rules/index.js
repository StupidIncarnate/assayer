'use strict';

/**
 * PURPOSE: Assayer's own local ESLint plugin — rules that make sense only against this repo's source,
 *   never against a consumer repo Assayer analyzes. `@dungeonmaster/eslint-plugin` cannot hold these:
 *   it knows nothing about Assayer's value contracts (`RepresentativeValue`, `ArrangeValue`), and a
 *   rule keyed on them would mean nothing to any other project.
 *
 *   This directory lives at the repo root, outside every `packages/*` workspace. A lint rule fits none
 *   of the dungeonmaster folder types (`adapters/`, `brokers/`, `guards/`, …), so putting it under
 *   `packages/*\/src` would fail the folder-type check that governs everything there. `eslint.config.js`
 *   excludes this directory from linting for the same reason, then registers this plugin under its own
 *   `'@assayer'` name — the same shape `'@dungeonmaster'` is registered under, one plugin object with a
 *   `rules` map.
 *
 * USAGE:
 * const assayerLocalRules = require('./eslint-rules');
 * // In eslint.config.js: plugins: { '@assayer': assayerLocalRules }, rules: { '@assayer/no-nullish-coalescing-on-arrange-value': 'error' }
 */

const noNullishCoalescingOnArrangeValue = require('./no-nullish-coalescing-on-arrange-value/no-nullish-coalescing-on-arrange-value-rule');

module.exports = {
  rules: {
    'no-nullish-coalescing-on-arrange-value': noNullishCoalescingOnArrangeValue,
  },
};
