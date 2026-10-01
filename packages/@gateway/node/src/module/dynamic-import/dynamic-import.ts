/**
 * PURPOSE: Wraps the native `import()` expression — a language construct, not a member of the
 * `module` object, so it cannot become a property on `index.ts`'s `moduleGateway` and lives in its
 * own file instead. Reach for this over a bare `import()`
 * anywhere outside the gateway, so every dynamic load goes through one mockable seam. Returns
 * `unknown`, never a caller-picked type: the gateway cannot import the caller's contracts, so a
 * caller parses the module namespace object it needs through one instead of asserting a shape.
 *
 * USAGE:
 * const mod = await dynamicImport({ path: '/abs/path/module.js' });
 * // Returns the module namespace object as `unknown`, which the caller parses through its own contract
 * // before reading from it;
 * // rejects with Node's own error for a missing module or a syntax error inside the loaded file — neither is caught or reshaped here.
 */

export const dynamicImport = async ({ path }: { path: string }): Promise<unknown> => import(path);
