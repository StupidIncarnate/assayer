/**
 * PURPOSE: Narrows a file's analyzed entries to the ones a run actually DRIVES — every entry except
 *   those the analysis names as undriven. Decides which entries the tests panel lists cases for, and
 *   which lines the code viewer's coverage gutter counts.
 *
 *   An undriven entry's cases are real derivation output, not a mistake: the analyzer read the scope
 *   and derived its full input-bucket case set. They are simply cases nothing will ever execute —
 *   `case-set-projection` drops the entry, so the run reports `0/0` and admits the scope as undriven
 *   instead. Listing those cases as pending tests is the reads-as-complete lie wearing a third face:
 *   the panel would advertise cases while the run beside it reports none.
 *
 *   For a module scope the derivation is not merely unrunnable but self-contradicting — with no
 *   params, every case arranges NOTHING, so the derived cases are identical setups each claiming a
 *   different exit, and at most one could ever hold. Rendering them as a checklist invites a reader to
 *   run tests that cannot exist.
 *
 *   Matching is by NAME because a name is all the admission carries. That is sufficient for what it
 *   selects — a module scope and an unexported helper — and inventing a sturdier key here would mean
 *   reconstructing what the walk already decided.
 *
 * USAGE:
 * drivenFunctionsTransformer({ functions: analysis.functions, undriven: analysis.undriven });
 * // Returns the entries a run drives — the module scope of a pure-statement file is absent
 */
import type { FunctionAnalysis, UndrivenEntry } from '@assayer/shared/contracts';

export const drivenFunctionsTransformer = ({
  functions,
  undriven,
}: {
  functions: readonly FunctionAnalysis[];
  undriven: readonly UndrivenEntry[];
}): readonly FunctionAnalysis[] => {
  const undrivenNames = new Set(undriven.map((entry) => String(entry.name)));

  return functions.filter((fn) => !undrivenNames.has(fn.entry.name));
};
