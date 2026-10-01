/**
 * PURPOSE: Pass-through for the npm package 'ts-jest'. Code outside the gateway imports ts-jest
 * through here instead of the raw package, so a future guard or override on ts-jest lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/ts-jest';
 */

export * from 'ts-jest';
export { default } from 'ts-jest';
