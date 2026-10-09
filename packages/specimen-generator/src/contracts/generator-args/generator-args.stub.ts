import type { StubArgument } from '@dungeonmaster/shared/@types';

import { generatorArgsContract } from './generator-args-contract';
import type { GeneratorArgs } from './generator-args-contract';

export const GeneratorArgsStub = ({ ...props }: StubArgument<GeneratorArgs> = {}): GeneratorArgs =>
  generatorArgsContract.parse({
    mode: 'write',
    ...props,
  });
