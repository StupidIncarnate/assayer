import { caseSignatureContract } from './case-signature-contract';
import type { CaseSignature } from './case-signature-contract';

export const CaseSignatureStub = (
  { value }: { value: string } = { value: '*module*/f/return@top::[]' },
): CaseSignature => caseSignatureContract.parse(value);
