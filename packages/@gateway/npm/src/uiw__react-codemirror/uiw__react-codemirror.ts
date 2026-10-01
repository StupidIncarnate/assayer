/**
 * PURPOSE: Pass-through for the npm package '@uiw/react-codemirror'. Code outside the gateway imports @uiw/react-codemirror
 * through here instead of the raw package, so a future guard or override on @uiw/react-codemirror lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/uiw__react-codemirror';
 */

export * from '@uiw/react-codemirror';
export { default } from '@uiw/react-codemirror';
