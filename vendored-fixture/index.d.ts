/**
 * A hand-authored minimal fixture package for the smoke-repo's `npm-package/` example. It lives
 * OUTSIDE the analyzed repo root (`smoke-repo/`) and is wired in as a `file:` dependency, so the
 * stitch resolves the bare `vendored-fixture` specifier through node's module resolution to a real
 * external package and pulls this declared signature as the imported callable's typed black box —
 * exactly as it would for a published npm dependency, but offline and deterministic. The declared
 * type shape is what the signature reader pulls; the matching `index.js` runtime is what the wrapped
 * runner executes when it drives the consumption module that calls `greet`.
 */
export declare const greet: (name: string) => string;
