/**
 * PURPOSE: Renders a literal VALUE as its AST projection token — `str:<value>` for a string,
 *   `num:<value>` for a number. The single owner of the literal token format, which appears both
 *   inside a condition's structural projection and in a switch case's coverage segment, so the two
 *   can never disagree about how a literal is identified.
 *
 * USAGE:
 * literalTokenTransformer({ value: 'get' });
 * // Returns 'str:get' (branded AstProjection)
 */
import type { RepresentativeValue } from '@assayer/shared/contracts';


export const literalTokenTransformer = ({ value }: { value: RepresentativeValue }): string =>
  (typeof value === 'string' ? `str:${value}` : `num:${value}`);
