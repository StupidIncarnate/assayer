import type { CompilerOptions } from '#gateway/npm/typescript';
import { impliedNodeFormatProxy } from '#gateway/npm/typescript/implied-node-format/implied-node-format.proxy';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { tsconfigOwnerBrokerProxy } from '../../tsconfig/owner/tsconfig-owner-broker.proxy';

export const moduleFormatReadBrokerProxy = (): {
  // The tsconfig beside the file owns it, with `options`. TypeScript's own answer for the file under those
  // options is `declared`; `nodeRule` is its answer under nodenext, asked only when `declared` is undefined.
  fileIs: (params: {
    absPath: string;
    options: CompilerOptions;
    declared: 'esm' | 'commonjs' | undefined;
    nodeRule: 'esm' | 'commonjs' | undefined;
  }) => void;
  // No tsconfig owns the file, and TypeScript answers `format` the one time it is asked.
  fileWithoutTsconfigIs: (params: { absPath: string; format: 'esm' | 'commonjs' }) => void;
  getFormatCallsFor: (params: { absPath: string }) => RecordedCalls;
} => {
  const owner = tsconfigOwnerBrokerProxy();
  const formatProxy = impliedNodeFormatProxy();

  return {
    fileIs: ({ absPath, options, declared, nodeRule }): void => {
      owner.filesOwnedBy({
        absPaths: [absPath],
        configFilePath: `${absPath.slice(0, absPath.lastIndexOf('/'))}/tsconfig.json`,
        options,
      });
      formatProxy.formatIsOnce({ fileName: absPath, format: declared });
      formatProxy.formatIsOnce({ fileName: absPath, format: nodeRule });
    },
    fileWithoutTsconfigIs: ({ absPath, format }): void => {
      owner.filesWithoutOwner({ absPaths: [absPath] });
      formatProxy.formatIs({ fileName: absPath, format });
    },
    getFormatCallsFor: ({ absPath }): RecordedCalls => formatProxy.getCallsFor({ fileName: absPath }),
  };
};
