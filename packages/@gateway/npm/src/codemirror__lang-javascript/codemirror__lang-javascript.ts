/**
 * PURPOSE: Pass-through for the npm package '@codemirror/lang-javascript'. Code outside the gateway imports @codemirror/lang-javascript
 * through here instead of the raw package, so a future guard or override on @codemirror/lang-javascript lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/codemirror__lang-javascript';
 */

export * from '@codemirror/lang-javascript';
