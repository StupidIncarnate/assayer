/**
 * PURPOSE: The ts-jest `astTransformers.before` entry — injects probes at EMIT time.
 *
 *   Emit time is the only thing that works: splicing probes into SOURCE destroys TypeScript's
 *   control-flow narrowing (`if (__P.c(id, !user))` is a CallExpression, so `if (!user) return;`
 *   followed by `user.name` fails to compile). Here the checker sees the original AST and probes
 *   exist only in the emitted JS.
 *
 *   Plain JS at the package root because ts-jest requires this from disk and reads
 *   `name`/`version`/`factory` off it. The injection itself lives in `probeInjectTransformer`, which is
 *   typed and unit-tested; this is only the ceremony plus the plan lookup. The transformer's module path
 *   arrives as the `probeInjectModule` option, which `run-execute-cases-broker` sets. It points into the same
 *   tree, source or dist, that the run's broker was loaded from. ts-jest hands `options` only to
 *   `factory`, so the transformer is required there.
 *
 * USAGE:
 * // ts-jest config: astTransformers: { before: [{ path: '<core>/probe-transformer.js', options: { probeDir, analyzerContentHash, probeInjectModule } }] }
 */
const { createHash } = require('node:crypto');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

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
  const { probeDir, probeInjectModule } = options;

  if (probeInjectModule === undefined) {
    throw new Error(
      "assayer: probe-transformer.js ran without its probeInjectModule option. run-execute-cases-broker sets it; this file is only loaded by Assayer's own runner.",
    );
  }

  const { probeInjectTransformer } = require(probeInjectModule);

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

    return probeInjectTransformer({ ts, context, sourceFile, sites: plan.sites });
  };
};
