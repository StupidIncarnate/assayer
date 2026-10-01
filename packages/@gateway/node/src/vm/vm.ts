/**
 * PURPOSE: Pass-through for the Node built-in 'vm', holding only the two calls a harness sandbox
 * needs: `createContext` builds the bare context, and `runInContext` evaluates transpiled harness
 * code inside it. Only the host imports this file. The code evaluated inside the context never
 * reaches a gateway import, because this file adds nothing to the context it creates.
 *
 * USAGE:
 * import { createContext, runInContext } from '#gateway/node/vm';
 * runInContext('module.exports.answer = 42;', createContext({ module: { exports: {} } }), { filename: 'audit.harness.ts' });
 */

export { createContext, runInContext } from 'vm';
