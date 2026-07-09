import { namespaceNameContract } from './namespace-name-contract';
import type { NamespaceName } from './namespace-name-contract';

export const NamespaceNameStub = (
  { value }: { value: string } = { value: 'master' }
): NamespaceName => namespaceNameContract.parse(value);
