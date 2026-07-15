/**
 * PURPOSE: The ts-jest `astTransformers.before` entry — injects probes at EMIT time.
 *
 *   Emit time is the only thing that works: splicing probes into SOURCE destroys TypeScript's
 *   control-flow narrowing (`if (__P.c(id, !user))` is a CallExpression, so `if (!user) return;`
 *   followed by `user.name` fails to compile). Here the checker sees the original AST and probes
 *   exist only in the emitted JS.
 *
 *   Plain JS at the package root — alongside the barrels — because ts-jest requires this from disk
 *   and reads `name`/`version`/`factory` off it. The injection itself lives in
 *   `jestProbeInjectAdapter`, which is typed and unit-tested; this is only the ceremony plus the
 *   plan lookup.
 *
 * USAGE:
 * // ts-jest config: astTransformers: { before: [{ path: '<core>/probe-transformer.js', options: { probeDir } }] }
 */
const { createHash } = require('node:crypto');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const { jestProbeInjectAdapter } = require('./dist/adapters');

exports.name = 'assayer-probe';

/**
 * PINNED, deliberately. ts-jest's own transformers document "increase the version whenever the
 * transformer's content is changed" — a manual version bump, which is the exact invalidation
 * mechanism this project ruled against. Instead the analyzer's CONTENT HASH is passed in `options`,
 * which ts-jest folds into its cache key, so invalidation is by content and this never moves.
 */
exports.version = 1;

exports.factory = (compilerInstance, options) => {
  const ts = compilerInstance.configSet.compilerModule;
  const { probeDir } = options;

  return (context) => (sourceFile) => {
    // Look the plan up by the hash of the text we were actually handed. A stale read is therefore
    // unrepresentable rather than merely unlikely: if the bytes differ, the plan simply is not there.
    const contentHash = createHash('sha256').update(sourceFile.text, 'utf8').digest('hex');
    const planPath = join(probeDir, `${contentHash}.json`);

    // No plan means this file is not part of the analyzed surface — a dependency, a shim, a test
    // file. Leaving it alone is correct; instrumenting it would be the bug.
    if (!existsSync(planPath)) {
      return sourceFile;
    }

    const plan = JSON.parse(readFileSync(planPath, 'utf8'));

    return jestProbeInjectAdapter({ ts, context, sourceFile, sites: plan.sites });
  };
};
