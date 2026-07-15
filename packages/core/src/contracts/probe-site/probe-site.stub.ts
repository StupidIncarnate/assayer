import type { StubArgument } from '@dungeonmaster/shared/@types';

import { probeSiteContract } from './probe-site-contract';
import type { ProbeSite } from './probe-site-contract';

export const ProbeSiteStub = ({ ...props }: StubArgument<ProbeSite> = {}): ProbeSite =>
  probeSiteContract.parse({
    id: 'grade/if:BinaryExpression,id:score,GreaterThanToken,num:5#leaf',
    kind: 'cond',
    start: 64,
    end: 73,
    ...props,
  });
