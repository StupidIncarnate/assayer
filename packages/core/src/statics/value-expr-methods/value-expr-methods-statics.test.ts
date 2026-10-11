import { valueExprMethodsStatics } from './value-expr-methods-statics';

describe('valueExprMethodsStatics', () => {
  it('VALID: {names} => the pure string methods', () => {
    expect(valueExprMethodsStatics.names).toStrictEqual(['slice', 'substring', 'toLowerCase', 'toUpperCase', 'trim']);
  });
});
