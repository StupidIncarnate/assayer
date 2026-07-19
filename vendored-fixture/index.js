// A minimal runtime for the smoke-repo's `npm-package/` example, matching the declared signature in
// index.d.ts (`greet: (name: string) => string`). The declared TYPE is what the stitch's external
// signature reader pulls; this runtime is what the wrapped runner executes when it drives the
// consumption module `npm-package/uses-package.ts` (`export const hello = greet('world')`).
'use strict';

const greet = (name) => 'hello, ' + name;

module.exports = { greet };
