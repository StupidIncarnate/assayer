import { admissionLineContract } from './admission-line-contract';
import type { AdmissionLine } from './admission-line-contract';

export const AdmissionLineStub = ({ value }: { value: string } = { value: '  GAP find — needs a harness' }): AdmissionLine =>
  admissionLineContract.parse(value);
