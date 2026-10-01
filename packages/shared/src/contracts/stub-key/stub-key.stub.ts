import type { StubEntry } from '../stub-entry/stub-entry-contract';
import { stubEntryContract } from '../stub-entry/stub-entry-contract';

const stubKeyContract = stubEntryContract.shape.key;

export const StubKeyStub = ({ value }: { value: string } = { value: 'src/config/config.ts#Config' }): StubEntry['key'] =>
  stubKeyContract.parse(value);
