import { astProjectionContract } from './ast-projection-contract';
import type { AstProjection } from './ast-projection-contract';

export const AstProjectionStub = ({ value }: { value: string } = { value: 'id:name' }): AstProjection =>
  astProjectionContract.parse(value);
