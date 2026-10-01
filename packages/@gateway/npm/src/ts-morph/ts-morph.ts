/**
 * PURPOSE: Pass-through for the npm package 'ts-morph'. Code outside the gateway imports ts-morph
 * through here instead of the raw package, so a future guard or override on ts-morph lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/ts-morph';
 */

export * from 'ts-morph';
