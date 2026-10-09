import { provenanceContract } from './provenance-contract';
import type { Provenance } from './provenance-contract';

export const ProvenanceStub = ({ value }: { value?: Provenance } = {}): Provenance =>
  provenanceContract.parse(value ?? 'param');
