import { packageNameContract } from './package-name-contract';
import type { PackageName } from './package-name-contract';

export const PackageNameStub = ({ value }: { value: string } = { value: 'react' }): PackageName =>
  packageNameContract.parse(value);
