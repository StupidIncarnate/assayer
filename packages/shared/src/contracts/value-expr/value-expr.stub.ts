import type { StubArgument } from '@legendscribe/pokayoke/shared/@types';

import { valueExprContract } from './value-expr-contract';
import type { ValueExpr } from './value-expr-contract';

export const ValueExprStub = ({ ...props }: StubArgument<ValueExpr> = {}): ValueExpr =>
  valueExprContract.parse({
    kind: 'param',
    name: 'value',
    ...props,
  });
