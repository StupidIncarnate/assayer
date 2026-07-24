import type { StubArgument } from '@dungeonmaster/shared/@types';

import { arrangeBindingContract } from './arrange-binding-contract';
import type { ArrangeBinding } from './arrange-binding-contract';

export const ArrangeBindingStub = ({ ...props }: StubArgument<Extract<ArrangeBinding, { kind: 'param' }>> = {}): ArrangeBinding =>
  arrangeBindingContract.parse({ kind: 'param', param: 'name', value: '', ...props });
