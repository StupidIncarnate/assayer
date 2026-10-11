import type { StubArgument } from '@legendscribe/lockdown-kit-shared/@types';

import { valueDomainContract } from './value-domain-contract';
import type { ValueDomain } from './value-domain-contract';

export const ValueDomainStub = ({ ...props }: StubArgument<ValueDomain> = {}): ValueDomain =>
  valueDomainContract.parse({ ...props });
