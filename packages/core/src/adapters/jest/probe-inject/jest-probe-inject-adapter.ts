/**
 * PURPOSE: Instruments one file's AST at EMIT time, wrapping every probe site in a `__P` call.
 *
 *   Emit time is not an optimization, it is the only thing that works. Splicing probes into SOURCE
 *   destroys TypeScript's control-flow narrowing — `if (__P.c(id, !user))` is a CallExpression, so
 *   `if (!user) return;` followed by `user.name` becomes "'user' is possibly 'null'", which is most
 *   real conditions. Here the checker sees the ORIGINAL AST and probes exist only in emitted JS.
 *   (It also dodges the splice's silent value bugs: `return (a, b)` yielding 1, `obj?.b.c` throwing.)
 *
 *   The FILE can itself be a site, which is why the recursion cannot own every case. A module scope
 *   completing — the file simply ending — is an exit like any other, and the only position that
 *   observes it is after the last statement. `visitEachChild` never visits the file it descends, so
 *   that one probe is appended here.
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
}): TS.SourceFile => {
  const visited = ts.visitEachChild(
    sourceFile,
    (child) => probeVisitNodeLayerAdapter({ ts, context, sourceFile, sites, node: child }),
    context,
  );

  const fileSite = sites.find(
    (candidate) =>
      candidate.kind === 'complete' &&
      candidate.start === sourceFile.getStart(sourceFile) &&
      candidate.end === sourceFile.getEnd(),
  );

  return fileSite === undefined
    ? visited
    : ts.factory.updateSourceFile(visited, [
        ...visited.statements,
        ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('__P'), 'x'),
            undefined,
            [ts.factory.createStringLiteral(fileSite.id), ts.factory.createIdentifier('undefined')],
          ),
        ),
      ]);
};
