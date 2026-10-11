/**
 * PURPOSE: The pure string methods a value expression can apply: the ones whose result Assayer can
 *   compute from their receiver and arguments alone.
 *
 * USAGE:
 * valueExprMethodsStatics.names; // ['slice', 'substring', 'toLowerCase', 'toUpperCase', 'trim']
 */
export const valueExprMethodsStatics = {
  names: ['slice', 'substring', 'toLowerCase', 'toUpperCase', 'trim'],
} as const;
