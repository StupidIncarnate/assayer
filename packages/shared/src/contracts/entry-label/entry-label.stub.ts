import { entryLabelContract } from './entry-label-contract';
import type { EntryLabel } from './entry-label-contract';

export const EntryLabelStub = (
  { value }: { value: string } = { value: 'rescale › items.map((n) => …) L2' },
): EntryLabel => entryLabelContract.parse(value);
