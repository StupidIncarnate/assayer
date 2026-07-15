import { syntaxKindNameContract } from './syntax-kind-name-contract';
import type { SyntaxKindName } from './syntax-kind-name-contract';

export const SyntaxKindNameStub = ({ value = 'IfStatement' }: { value?: string } = {}): SyntaxKindName =>
  syntaxKindNameContract.parse(value);
