/**
 * PURPOSE: The TypeScript compiler ts-jest compiles generated tests with, named by path in ts-jest's
 *   `compiler` option. It is the copy `ts-morph` bundles, the same object the analyzer walks with. So
 *   the compiler that places each probe parses the code with the same version that recorded the probe
 *   sites.
 *
 *   Plain JS at the package root because ts-jest's `compiler` option names a module that ts-jest
 *   requires on its own, and the nested Jest config is JSON, so it can only carry a path.
 *
 * USAGE:
 * // ts-jest config: { compiler: '<core>/bundled-typescript.js' }
 */
module.exports = require('ts-morph').ts;
