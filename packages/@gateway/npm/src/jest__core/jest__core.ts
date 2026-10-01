/**
 * PURPOSE: Pass-through for the npm package '@jest/core'. Code outside the gateway imports @jest/core
 * through here instead of the raw package, so a future guard or override on @jest/core lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/jest__core';
 */

export * from '@jest/core';
