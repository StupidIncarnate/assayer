/**
 * PURPOSE: Renders a derived case's arrange bindings as the text a human reads beside it — in the
 *   CLI's unit report, in `assayer detail`, and in the desktop's tests panel.
 *
 *   It is shared because those three must not disagree: the panel and the report describe the SAME
 *   case, so two spellings of one arrange is two encodings of one concept, and the one that drifts is
 *   whichever nobody looked at.
 *
 *   Each kind renders as what it IS, which is the whole reason `arrange` is a union. A param is an
 *   argument, so it renders as one, positionally. An environment variable is not: nothing is passed
 *   to a module scope, a key is WRITTEN before it is imported — so it renders as the assignment a
 *   reader would type to reproduce it. Rendering both positionally, which is what a single shape
 *   forced, printed a module case as `*module*("6")` — a call that never happened, passing an
 *   argument nothing accepts, naming neither the variable that actually decided the arm nor the fact
 *   that it was the environment. Error text is product surface (P1), and that line was a lie in it.
 *
 *   An `object` param is an argument too, so it renders positionally like a scalar param — as the
 *   object literal a reader would pass, its properties in the same sorted order the arrange carries. It
 *   NESTS exactly as an array param does: a property holding an object or an array renders whole, to
 *   whatever depth the value carries, because the literal a reader would type is the whole literal.
 *
 *   A `harness` binding renders as its KEY PATH in angle brackets, never as a value, because there is no
 *   value here to render: the argument is whatever the colocated harness registered under that key, and
 *   only the run holds it. `<harness inputs.audit.report>` tells the reader both that this argument was
 *   supplied rather than derived and exactly which line of which file supplied it — so a case a human
 *   closed is never mistaken for one Assayer built out of a declared type.
 *
 *   An `array` or `harness` binding marked `rest` is not one argument at the call site: the interpreter
 *   SPREADS its resolved value across the tail positional slots the rest parameter stands for
 *   (`caseInterpretBroker`), so `tally(11, ...[6,9])` is the call that happens and `tally(11, [6,9])`
 *   — what one bracketed token beside `size` would otherwise print — is one that never does. Both
 *   consumers of this text build exactly that call string (`${entryName}(${arrangeText})`), so the `...`
 *   prefix is what keeps it truthful, the same reason the module-case rendering above refuses to print an
 *   argument nothing accepts.
 *
 * USAGE:
 * arrangeTextTransformer({ arrange: testCase.arrange });
 * // Returns '6, 2' for params, 'LEVEL="6"' for an environment read, '{"db":{"host":"x"}}' for an
 * // object, '<harness inputs.audit.report>' for a harness-supplied input, or '...[6,9]' /
 * // '...<harness inputs.collect.sinks>' for either kind realizing a rest parameter
 */
import type { DerivedTestCase } from '../../contracts/derived-test-case/derived-test-case-contract';

export const arrangeTextTransformer = ({ arrange }: { arrange: DerivedTestCase['arrange'] }): string =>
  arrange
      .map((binding) => {
        // Only an `array` or `harness` binding can realize a rest parameter (the contract carries
        // `rest` on no other arm — a rest parameter's declared type is always an array), and the
        // interpreter spreads both alike, so one check covers both.
        const spread = (binding.kind === 'array' || binding.kind === 'harness') && binding.rest === true ? '...' : '';

        return binding.kind === 'env'
          ? `${String(binding.name)}=${JSON.stringify(binding.value)}`
          : binding.kind === 'harness'
            ? `${spread}<harness ${String(binding.key)}>`
            : `${spread}${JSON.stringify(binding.value)}`;
      })
      // `binding.value` is a scalar for a param and a recursive value for an array or object —
      // `JSON.stringify` renders each as the literal a reader would pass, generic over the nesting, so
      // a single arm covers them all.
      .join(', ');
