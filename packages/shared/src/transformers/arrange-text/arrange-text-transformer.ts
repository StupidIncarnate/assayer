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
 * USAGE:
 * arrangeTextTransformer({ arrange: testCase.arrange });
 * // Returns '6, 2' for params, or 'LEVEL="6"' for an environment read
 */
import { arrangeTextContract } from '../../contracts/arrange-text/arrange-text-contract';
import type { ArrangeText } from '../../contracts/arrange-text/arrange-text-contract';
import type { DerivedTestCase } from '../../contracts/derived-test-case/derived-test-case-contract';

export const arrangeTextTransformer = ({ arrange }: { arrange: DerivedTestCase['arrange'] }): ArrangeText =>
  arrangeTextContract.parse(
    arrange
      .map((binding) =>
        binding.kind === 'env'
          ? `${String(binding.name)}=${JSON.stringify(binding.value)}`
          : JSON.stringify(binding.value),
      )
      .join(', '),
  );
