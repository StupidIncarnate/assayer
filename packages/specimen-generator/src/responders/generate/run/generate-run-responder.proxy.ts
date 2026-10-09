import { join } from '#gateway/node/path';

import { specimensCheckBrokerProxy } from '../../../brokers/specimens/check/specimens-check-broker.proxy';
import { specimensGenerateBrokerProxy } from '../../../brokers/specimens/generate/specimens-generate-broker.proxy';
import { specimensWriteBrokerProxy } from '../../../brokers/specimens/write/specimens-write-broker.proxy';
import { generatorLayoutStatics } from '../../../statics/generator-layout/generator-layout-statics';

export const GenerateRunResponderProxy = (): {
  // The repo holds the generator's declarations: the syntaxes `gt`, `if`, `nullish` and `ternary`, and one
  // container, `function-declaration`, with a statement slot `body` and an expression slot `default-param`.
  setupDeclarations: ({ repoRoot }: { repoRoot: string }) => void;
} => {
  const generator = specimensGenerateBrokerProxy();
  specimensWriteBrokerProxy();
  specimensCheckBrokerProxy();

  return {
    setupDeclarations: ({ repoRoot }): void => {
      generator.setupTree({
        declarationsRoot: join(repoRoot, 'packages', 'specimen-generator', generatorLayoutStatics.declarations.folder),
      });
    },
  };
};
