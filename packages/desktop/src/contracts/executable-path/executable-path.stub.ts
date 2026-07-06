import { executablePathContract } from './executable-path-contract';
import type { ExecutablePath } from './executable-path-contract';

export const ExecutablePathStub = ({
  value,
}: { value: string } = { value: '/usr/bin/electron' }): ExecutablePath => executablePathContract.parse(value);
