/**
 * PURPOSE: Pass-through for the npm package '@codemirror/view'. Code outside the gateway imports @codemirror/view
 * through here instead of the raw package, so a future guard or override on @codemirror/view lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/codemirror__view';
 */

export * from '@codemirror/view';
