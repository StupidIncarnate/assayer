import { envValueContract } from './env-value-contract';
import type { EnvValue } from './env-value-contract';

export const EnvValueStub = ({ value }: { value: string } = { value: '6' }): EnvValue =>
  envValueContract.parse(value);
