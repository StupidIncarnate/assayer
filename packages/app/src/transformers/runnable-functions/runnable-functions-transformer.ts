/**
 * PURPOSE: Narrows a file's analyzed entries to the ones with cases to list. The tests panel lists cases
 *   only for these entries, and the code viewer's gutter reads the same entries, so the two panes
 *   always agree.
 *
 *   An entry is listed when its access is not `unreachable` and it has at least one derived case. A case
 *   on a route through a branch Assayer cannot steer is still a case: it is listed, marked undriven, and
 *   never run, so an entry named in `undriven` lists its routes beside the admission.
 *
 * USAGE:
 * runnableFunctionsTransformer({ functions: analysis.functions });
 * // Returns the entries with cases. An unreachable entry, or one with no cases, is absent.
 */
import type { FunctionAnalysis } from '@assayer/shared/contracts';

export const runnableFunctionsTransformer = ({
  functions,
}: {
  functions: readonly FunctionAnalysis[];
}): readonly FunctionAnalysis[] =>
  functions.filter((fn) => fn.entry.access.kind !== 'unreachable' && fn.cases.length > 0);
