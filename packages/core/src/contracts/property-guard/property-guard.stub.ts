import type { StubArgument } from '@dungeonmaster/shared/@types';

import { propertyGuardContract } from './property-guard-contract';
import type { PropertyGuard } from './property-guard-contract';

export const PropertyGuardStub = ({ ...props }: StubArgument<PropertyGuard> = {}): PropertyGuard =>
  propertyGuardContract.parse({
    key: 'src/config/config.ts#Config',
    property: 'mode',
    reader: 'src/decide.ts',
    line: 6,
    predicate: { kind: 'eq', literal: 'a' },
    operandType: { kind: 'string' },
    ...props,
  });
