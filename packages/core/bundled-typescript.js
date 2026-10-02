/**
 * PURPOSE: The TypeScript compiler ts-jest compiles generated tests with, named by path in ts-jest's
 *   `compiler` option. It is the copy `ts-morph` bundles, loaded from the same ts-morph install the npm
 *   gateway (`@assayer/npm`) loads, so it is the very object `#gateway/npm/typescript` exports and the
 *   analyzer walks with. The compiler that places each probe therefore parses the code with the same
 *   TypeScript that recorded the probe sites.
 *
 *   ts-morph is resolved from the gateway package's own directory, never from core's. An install can
 *   give core and the gateway separate ts-morph copies, and the analyzer hash reads ts-morph's version
 *   from the gateway's directory too. Resolving from one place means the copy that compiles is the copy
 *   that is hashed. The gateway is found from core's root, and Node resolves it to its real path, which
 *   is where Node resolves the gateway's own `ts-morph` import from.
 *
 *   Plain JS at the package root because ts-jest's `compiler` option names a module that ts-jest
 *   requires on its own, and the nested Jest config is JSON, so it can only carry a path.
 *
 * USAGE:
 * // ts-jest config: { compiler: '<core>/bundled-typescript.js' }
 */
const { dirname } = require('path');

const gatewayDir = dirname(require.resolve('@assayer/npm/package.json'));

module.exports = require(require.resolve('ts-morph', { paths: [gatewayDir] })).ts;
