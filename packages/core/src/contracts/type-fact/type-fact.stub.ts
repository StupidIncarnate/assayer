import type { StubArgument } from '@dungeonmaster/shared/@types';

import { typeFactContract } from './type-fact-contract';
import type { TypeFact } from './type-fact-contract';

export const TypeFactStub = ({ ...props }: StubArgument<TypeFact> = {}): TypeFact =>
  typeFactContract.parse({ flavor: 'string', ...props });
