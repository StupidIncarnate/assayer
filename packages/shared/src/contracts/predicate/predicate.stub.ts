import type { StubArgument } from '@legendscribe/pokayoke/shared/@types';

import { predicateContract } from './predicate-contract';
import type { Predicate } from './predicate-contract';

export const PredicateStub = ({ ...props }: StubArgument<Predicate> = {}): Predicate =>
  predicateContract.parse({ kind: 'truthy', ...props });
