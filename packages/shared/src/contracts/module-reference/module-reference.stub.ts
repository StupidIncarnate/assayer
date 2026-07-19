import type { StubArgument } from '@dungeonmaster/shared/@types';

import { moduleReferenceContract } from './module-reference-contract';
import type { ModuleReference } from './module-reference-contract';

export const ModuleReferenceStub = ({ ...props }: StubArgument<ModuleReference> = {}): ModuleReference =>
  moduleReferenceContract.parse({
    specifier: './other',
    importedName: 'foo',
    line: 1,
    column: 1,
    ...props,
  });
