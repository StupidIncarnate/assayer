import type { StubArgument } from '@legendscribe/lockdown-kit-shared/@types';

import { invokedFnContract } from './invoked-fn-contract';
import type { InvokedFn } from './invoked-fn-contract';

export const InvokedFnStub = ({ ...props }: StubArgument<InvokedFn> = {}): InvokedFn =>
  invokedFnContract.parse({
    startLine: 1,
    args: [],
    ...props,
  });
