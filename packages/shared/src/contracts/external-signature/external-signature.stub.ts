import type { StubArgument } from '@dungeonmaster/shared/@types';

import { externalSignatureContract } from './external-signature-contract';
import type { ExternalSignature } from './external-signature-contract';

export const ExternalSignatureStub = ({ ...props }: StubArgument<ExternalSignature> = {}): ExternalSignature =>
  externalSignatureContract.parse({
    params: [{ name: 'name', type: { kind: 'string' } }],
    returnType: { kind: 'string' },
    ...props,
  });
