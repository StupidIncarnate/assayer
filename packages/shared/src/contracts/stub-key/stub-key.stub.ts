import type { StubEntry } from '../stub-entry/stub-entry-contract';
import { stubEntryContract } from '../stub-entry/stub-entry-contract';

export const StubKeyStub = ({ value }: { value: string } = { value: 'src/config/config.ts#Config' }): StubEntry['key'] =>
  stubEntryContract.shape.key.parse(value);
