import { impliedNodeFormatProxy } from '#gateway/npm/typescript/implied-node-format/implied-node-format.proxy';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { tsconfigReadBrokerProxy } from '../../tsconfig/read/tsconfig-read-broker.proxy';

export const moduleFormatReadBrokerProxy = (): {
  // The tsconfig nearest the file's directory holds `tsconfigText`. TypeScript's own answer for the file
  // under those options is `declared`; `nodeRule` is its answer under nodenext, asked only when
  // `declared` is undefined.
  fileIs: (params: {
    absPath: string;
    directory: string;
    tsconfigText: string;
    declared: 'esm' | 'commonjs' | undefined;
    nodeRule: 'esm' | 'commonjs' | undefined;
  }) => void;
  // No tsconfig above the file's directory, and TypeScript answers `format` the one time it is asked.
  fileWithoutTsconfigIs: (params: { absPath: string; directory: string; format: 'esm' | 'commonjs' }) => void;
  getFormatCallsFor: (params: { absPath: string }) => RecordedCalls;
} => {
  const tsconfigProxy = tsconfigReadBrokerProxy();
  const formatProxy = impliedNodeFormatProxy();

  return {
    fileIs: ({ absPath, directory, tsconfigText, declared, nodeRule }): void => {
      tsconfigProxy.tsconfigAt({ searchPath: directory, configFilePath: `${directory}/tsconfig.json`, text: tsconfigText });
      formatProxy.formatIsOnce({ fileName: absPath, format: declared });
      formatProxy.formatIsOnce({ fileName: absPath, format: nodeRule });
    },
    fileWithoutTsconfigIs: ({ absPath, directory, format }): void => {
      tsconfigProxy.noTsconfigAt({ searchPath: directory });
      formatProxy.formatIs({ fileName: absPath, format });
    },
    getFormatCallsFor: ({ absPath }): RecordedCalls => formatProxy.getCallsFor({ fileName: absPath }),
  };
};
