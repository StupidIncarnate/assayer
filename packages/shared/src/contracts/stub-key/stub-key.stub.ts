import { stubKeyContract } from './stub-key-contract';
import type { StubKey } from './stub-key-contract';

export const StubKeyStub = ({ value }: { value: string } = { value: 'src/config/config.ts#Config' }): StubKey =>
  stubKeyContract.parse(value);
