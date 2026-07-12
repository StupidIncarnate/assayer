import { registerMock } from '@dungeonmaster/testing/register-mock';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import { configFindBroker, configGenerateBroker, configLoadBroker } from '@assayer/core/brokers';
import { configFindBrokerProxy, configGenerateBrokerProxy, configLoadBrokerProxy } from '@assayer/core/testing';
import { filePathContract, sourcePositionContract } from '@assayer/core/contracts';
import type { FilePath } from '@assayer/core/contracts';
import { assayerConfigContract } from '@assayer/shared/contracts';

const POSITION_MARKER = 'position ';

export const ConfigResolveLayerResponderProxy = (): {
  configLivesIn: (params: { levelsBelow: number }) => void;
  neverFound: () => void;
  hasContent: (params: { content: string }) => void;
  succeeds: () => void;
  getWrittenPath: () => unknown;
  getWrittenContent: () => unknown;
} => {
  // The @assayer/core/testing composed proxies below are instantiated to satisfy
  // enforce-proxy-child-creation, but the cross-package registerMock chain they set up cannot
  // intercept real I/O here (the ts-jest proxy-mock AST collector only resolves relative
  // imports, so it never walks into a bare "@assayer/core/testing" specifier to find the
  // registerMock calls nested inside core's own adapter proxies — see
  // stable-branch-layer-responder.proxy.ts for the same gotcha). The direct registerMock calls
  // below, on the broker functions themselves, are what actually drives this proxy's behavior.
  configFindBrokerProxy();
  configGenerateBrokerProxy();
  configLoadBrokerProxy();

  const findHandle = registerMock({ fn: configFindBroker });
  const generateHandle = registerMock({ fn: configGenerateBroker });
  const loadHandle = registerMock({ fn: configLoadBroker });
  const generatedConfigDirCalls: FilePath[] = [];

  findHandle.mockImplementation(async ({ startDir }: { startDir: string }) => {
    return Promise.resolve({
      found: true as const,
      configDir: filePathContract.parse(startDir),
      configPath: filePathContract.parse(`${startDir}/assayer.config.json`),
    });
  });
  generateHandle.mockImplementation(async ({ configDir }: { configDir: string }) => {
    generatedConfigDirCalls.push(filePathContract.parse(configDir));

    return Promise.resolve(assayerConfigContract.parse({}));
  });

  return {
    configLivesIn: (_params: { levelsBelow: number }): void => undefined,
    neverFound: (): void => {
      findHandle.mockResolvedValueOnce({ found: false });
    },
    hasContent: ({ content }: { content: string }): void => {
      loadHandle.mockImplementationOnce(async () => {
        try {
          const parsed = JSON.parse(content) as unknown;

          return await Promise.resolve({ success: true as const, data: assayerConfigContract.parse(parsed) });
        } catch (error: unknown) {
          if (!(error instanceof SyntaxError)) {
            throw error;
          }

          const markerIndex = error.message.indexOf(POSITION_MARKER);
          const offset =
            markerIndex === -1 ? 0 : Number.parseInt(error.message.slice(markerIndex + POSITION_MARKER.length), 10);
          const upTo = content.slice(0, offset);
          const line = upTo.split('\n').length;
          const column = offset - upTo.lastIndexOf('\n');
          const position = sourcePositionContract.parse({ line, column });

          return Promise.resolve({
            success: false as const,
            message: errorMessageContract.parse(error.message),
            line: position.line,
            column: position.column,
          });
        }
      });
    },
    succeeds: (): void => undefined,
    getWrittenPath: (): unknown => {
      const configDir = generatedConfigDirCalls.at(-1);

      return configDir === undefined ? undefined : `${configDir}/assayer.config.json`;
    },
    getWrittenContent: (): unknown =>
      generatedConfigDirCalls.length === 0 ? undefined : JSON.stringify(assayerConfigContract.parse({})),
  };
};
