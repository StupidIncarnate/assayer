import { normalizedSourceContract } from './normalized-source-contract';
import type { NormalizedSource } from './normalized-source-contract';

export const NormalizedSourceStub = ({ value = 'name.length === 0' }: { value?: string } = {}): NormalizedSource =>
  normalizedSourceContract.parse(value);
