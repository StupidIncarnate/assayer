import type { StubArgument } from '@dungeonmaster/shared/@types';

import { renderedFillContract } from './rendered-fill-contract';
import type { RenderedFill } from './rendered-fill-contract';

export const RenderedFillStub = ({ ...props }: StubArgument<RenderedFill> = {}): RenderedFill =>
  renderedFillContract.parse({
    text: "if (value > 5) {\n    return 'then';\n}\nreturn 'else';",
    params: [{ name: 'value', type: 'number' }],
    declarations: [],
    ...props,
  });
