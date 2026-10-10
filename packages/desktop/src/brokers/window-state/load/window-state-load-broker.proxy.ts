import { join } from '#gateway/node/path';
import { readJsonFileIfExistsProxy } from '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';
import type { WindowState } from '../../../contracts/window-state/window-state-contract';

export const windowStateLoadBrokerProxy = (): {
  setupStateFound: (params: { repoPath: string; state: WindowState }) => void;
  setupStateMissing: (params: { repoPath: string }) => void;
  setupStateMalformed: (params: { repoPath: string }) => void;
  setupStateInvalidSchema: (params: { repoPath: string }) => void;
  setupReadDenied: (params: { repoPath: string }) => void;
} => {
  const readJsonProxy = readJsonFileIfExistsProxy();

  return {
    setupStateFound: ({ repoPath, state }: { repoPath: string; state: WindowState }): void => {
      readJsonProxy.returnsRaw({
        path: join(repoPath, '.assayer', 'window-state.json'),
        rawContents: JSON.stringify(state),
      });
    },
    setupStateMissing: ({ repoPath }: { repoPath: string }): void => {
      readJsonProxy.missing({
        path: join(repoPath, '.assayer', 'window-state.json'),
      });
    },
    setupStateMalformed: ({ repoPath }: { repoPath: string }): void => {
      readJsonProxy.returnsRaw({
        path: join(repoPath, '.assayer', 'window-state.json'),
        rawContents: '{ invalid json',
      });
    },
    setupStateInvalidSchema: ({ repoPath }: { repoPath: string }): void => {
      readJsonProxy.returnsRaw({
        path: join(repoPath, '.assayer', 'window-state.json'),
        rawContents: JSON.stringify({ width: -10, height: 800 }),
      });
    },
    setupReadDenied: ({ repoPath }: { repoPath: string }): void => {
      readJsonProxy.denied({
        path: join(repoPath, '.assayer', 'window-state.json'),
      });
    },
  };
};
