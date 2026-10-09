/**
 * PURPOSE: Evaluates whether a known welded constant value satisfies a branch predicate.
 *
 * USAGE:
 * evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'gt', literal: 'm' });
 * // Returns false
 */
import type { Predicate } from '@assayer/shared/contracts';

export const evaluateConstPredicateLayerTransformer = ({
  value,
  predicateKind,
  literal,
}: {
  value: unknown;
  predicateKind: Predicate['kind'];
  literal?: unknown;
}): boolean => {
  switch (predicateKind) {
    case 'truthy':
      return Boolean(value);
    case 'falsy':
      return !value;
    case 'eq':
      return value === literal;
    case 'neq':
      return value !== literal;
    case 'gt':
      return (value as number | string) > (literal as number | string);
    case 'gte':
      return (value as number | string) >= (literal as number | string);
    case 'lt':
      return (value as number | string) < (literal as number | string);
    case 'lte':
      return (value as number | string) <= (literal as number | string);
    case 'non-nullish':
      return value !== null && value !== undefined;
    case 'undefined-eq':
      return value === undefined;
    case 'undefined-neq':
      return value !== undefined;
    case 'typeof-eq':
      return typeof value === literal;
    case 'typeof-neq':
      return typeof value !== literal;
    case 'length-eq':
      return typeof value === 'string' || Array.isArray(value) ? value.length === literal : false;
    case 'length-neq':
      return typeof value === 'string' || Array.isArray(value) ? value.length !== literal : false;
    case 'length-gt':
      return typeof value === 'string' || Array.isArray(value) ? value.length > (literal as number) : false;
    case 'length-gte':
      return typeof value === 'string' || Array.isArray(value) ? value.length >= (literal as number) : false;
    case 'length-lt':
      return typeof value === 'string' || Array.isArray(value) ? value.length < (literal as number) : false;
    case 'length-lte':
      return typeof value === 'string' || Array.isArray(value) ? value.length <= (literal as number) : false;
    case 'unrecognized':
    default:
      return true;
  }
};
