/**
 * PURPOSE: Instruments one file's AST at EMIT time, wrapping every probe site in a `__P` call.
 *
 *   Emit time is not an optimization, it is the only thing that works. Splicing probes into SOURCE
 *   destroys TypeScript's control-flow narrowing — `if (__P.c(id, !user))` is a CallExpression, so
 *   `if (!user) return;` followed by `user.name` becomes "'user' is possibly 'null'", which is most
 *   real conditions. Here the checker sees the ORIGINAL AST and probes exist only in emitted JS.
 *   (It also dodges the splice's silent value bugs: `return (a, b)` yielding 1, `obj?.b.c` throwing.)
 *
 *   `ts` is a parameter, not an import: it must be the module the HOST compiler is using — nodes from
 *   a second TypeScript instance are not interchangeable — and passing it keeps this testable without
 *   standing up a ts-jest instance.
 *
 * USAGE:
 * jestProbeInjectAdapter({ ts, context, sourceFile, sites: plan.sites });
 * // Returns the SourceFile with each site's expression wrapped in __P.c / __P.x
 */
import type TS from 'typescript';

import type { ProbeSite } from '../../../contracts/probe-site/probe-site-contract';
import { probeVisitNodeLayerAdapter } from './probe-visit-node-layer-adapter';

export const jestProbeInjectAdapter = ({
  ts,
  context,
  sourceFile,
  sites,
}: {
  ts: typeof TS;
  context: TS.TransformationContext;
  sourceFile: TS.SourceFile;
  sites: ProbeSite[];
}): TS.SourceFile =>
  // visitEachChild on the SourceFile rather than visitNode on it: the file is never itself a site, and
  // this returns a SourceFile without a cast.
  ts.visitEachChild(
    sourceFile,
    (child) => probeVisitNodeLayerAdapter({ ts, context, sourceFile, sites, node: child }),
    context,
  );
