import { envVarNameContract } from './env-var-name-contract';
import type { EnvVarName } from './env-var-name-contract';

export const EnvVarNameStub = ({ value }: { value: string } = { value: 'VALUE' }): EnvVarName =>
  envVarNameContract.parse(value);
