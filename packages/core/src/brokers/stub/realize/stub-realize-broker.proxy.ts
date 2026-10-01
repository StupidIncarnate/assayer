import { analyzeFileBrokerProxy } from '../../analyze/file/analyze-file-broker.proxy';
import { tsconfigReadBrokerProxy } from '../../tsconfig/read/tsconfig-read-broker.proxy';
import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const stubRealizeBrokerProxy = (): {
  // `specifier` is the import path the file under test spells (e.g. './types').
  setupTypeDefinition: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }) => void;
  importResolvesToNothing: ({ specifier }: { specifier: string }) => void;
} => {
  // The analyze, tsconfig read, and hash run REAL — the same real pipeline compose uses. Only the
  // sibling resolve is staged, because resolving a cross-file type against a real filesystem is exactly
  // what a unit test cannot do; the caller says where a specifier lands and what the definition's
  // source is instead.
  analyzeFileBrokerProxy();
  tsconfigReadBrokerProxy();
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    // A cross-file type's definition both RESOLVES to `fileName` and READS back `source` — the pair a
    // cross-file object read needs. Each one answers one resolve of its specifier.
    setupTypeDefinition: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }): void => {
      sibling.resolvesToSibling({ fileName, source, specifier });
    },
    // The import names a specifier that resolves to no file at all, so the type stays opaque.
    importResolvesToNothing: ({ specifier }: { specifier: string }): void => {
      sibling.resolvesToNothing({ specifier });
    },
  };
};
