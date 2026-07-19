import type { StubArgument } from '@dungeonmaster/shared/@types';

import { valueDomainContract } from './value-domain-contract';
import type { ValueDomain } from './value-domain-contract';

export const ValueDomainStub = ({ ...props }: StubArgument<ValueDomain> = {}): ValueDomain =>
  valueDomainContract.parse({ ...props });
