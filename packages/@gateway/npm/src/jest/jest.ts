/**
 * PURPOSE: Pass-through for the npm package 'jest'. Code outside the gateway imports jest
 * through here instead of the raw package, so a future guard or override on jest lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/jest';
 */

export * from 'jest';
