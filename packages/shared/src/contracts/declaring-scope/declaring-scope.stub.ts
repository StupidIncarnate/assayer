import type { StubArgument } from '@legendscribe/lockdown-kit-shared/@types';

import { declaringScopeContract } from './declaring-scope-contract';
import type { DeclaringScope } from './declaring-scope-contract';

export const DeclaringScopeStub = ({ ...props }: StubArgument<DeclaringScope> = {}): DeclaringScope =>
  declaringScopeContract.parse({
    name: 'build',
    hostEntry: 'audit',
    params: [{ name: 'report', type: { kind: 'callable', text: '(message: string) => string' } }],
    ...props,
  });
