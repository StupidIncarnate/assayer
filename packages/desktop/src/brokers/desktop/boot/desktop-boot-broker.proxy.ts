import { electronProxy } from '#gateway/npm/electron/electron.proxy';
import { resolveModulePathProxy } from '#gateway/node/module/resolve-module-path/resolve-module-path.proxy';
import { join } from '#gateway/node/path';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { getPlatformProxy } from '#gateway/node/process/get-platform/get-platform.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { pathToFileURL } from '#gateway/node/url';

import { windowStateLoadBrokerProxy } from '../../window-state/load/window-state-load-broker.proxy';
import { windowStateSaveBrokerProxy } from '../../window-state/save/window-state-save-broker.proxy';
import type { WindowState } from '../../../contracts/window-state/window-state-contract';

const DEV_RENDERER_URL = 'http://localhost:6273';
const PAGE_SPECIFIER = '@assayer/app/page';
// An installed layout, not this monorepo's, so the boot must load whatever path the resolution answers.
const INSTALLED_PAGE_PATH = '/consumer/node_modules/@assayer/app/dist/index.html';

export const desktopBootBrokerProxy = (): {
  handledChannels: () => readonly string[];
  invokeHandler: (params: { channel: string; arg?: unknown }) => Promise<unknown>;
  sentToRendererOn: (params: { channel: string }) => unknown[][];
  setupBoot: (params: { dev: boolean; headless: boolean; repoPath?: string }) => void;
  setupPlatform: (params: { value: NodeJS.Platform }) => void;
  windowCallsWith: (params: { options: unknown }) => unknown[][];
  loadedUrls: (params: { url: string }) => unknown[][];
  emitAllWindowsClosed: () => void;
  quitCalls: () => unknown[][];
  pageResolutionsFromBroker: () => readonly unknown[][];
  preloadPath: () => string;
  setupWindowStateFound: (params: { repoPath: string; state: WindowState }) => void;
  setupWindowStateMissing: (params: { repoPath: string }) => void;
  setupWindowSave: (params: { repoPath: string }) => void;
  savedWindowState: (params: { repoPath: string }) => Promise<unknown>;
  setupDisplays: (params: { displays: readonly unknown[] }) => void;
  setupWindowBounds: (params: { bounds: { x: number; y: number; width: number; height: number } }) => void;
  setupIsMaximized: (params: { value: boolean }) => void;
  setupIsFullScreen: (params: { value: boolean }) => void;
  emitWindowEvent: (params: { event: string; args?: readonly unknown[] }) => void;
  maximizeCalls: () => unknown[][];
  setFullScreenCalls: () => unknown[][];
} => {
  // The broker resolves the page from its own file, which sits beside this one.
  const brokerFilePath = join(__dirname, 'desktop-boot-broker.ts');
  const electronGateway = electronProxy();
  const resolveGateway = resolveModulePathProxy();
  const envGateway = getEnvProxy();
  const platformGateway = getPlatformProxy();
  stderrProxy();
  const windowStateLoadProxy = windowStateLoadBrokerProxy();
  const windowStateSaveProxy = windowStateSaveBrokerProxy();

  return {
    // Every registered channel, not one in particular — a legitimate blanket collector.
    handledChannels: (): readonly string[] => electronGateway.getHandledChannels(),
    // Handlers reply to their SENDER, so the invoked event carries the double's recording sender.
    invokeHandler: async ({
      channel,
      arg,
    }: {
      channel: string;
      arg?: unknown;
    }): Promise<unknown> =>
      electronGateway.invokeHandler({ channel, args: arg === undefined ? [] : [arg] }),
    sentToRendererOn: ({ channel }: { channel: string }): unknown[][] =>
      electronGateway.getSentToSenderFor({ channel }).map((call) => [...call]),
    // Stages the two environment flags the boot reads, where `@assayer/app/page` resolves from the
    // broker's own file, and the renderer URL the boot will then load. A boot that finds no staged URL
    // fails, so every test that boots calls this first.
    setupBoot: ({ dev, headless, repoPath = '/repo' }: { dev: boolean; headless: boolean; repoPath?: string }): void => {
      envGateway.setupEnv({ name: 'ASSAYER_DEV', value: dev ? '1' : undefined });
      envGateway.setupEnv({ name: 'ASSAYER_HEADLESS', value: headless ? '1' : undefined });
      resolveGateway.returns({
        specifier: PAGE_SPECIFIER,
        fromPath: brokerFilePath,
        path: INSTALLED_PAGE_PATH,
      });
      electronGateway.loadUrlResolves({ url: dev ? DEV_RENDERER_URL : pathToFileURL(INSTALLED_PAGE_PATH).href });
      windowStateLoadProxy.setupStateMissing({ repoPath });
      windowStateSaveProxy.setupSaveSucceeds({ repoPath });
    },
    setupPlatform: ({ value }: { value: NodeJS.Platform }): void => {
      platformGateway.setupPlatform({ value });
    },
    windowCallsWith: ({ options }: { options: unknown }): unknown[][] =>
      electronGateway.getBrowserWindowCallsFor({ options }).map((call) => [...call]),
    loadedUrls: ({ url }: { url: string }): unknown[][] =>
      electronGateway.getLoadUrlCallsFor({ url }).map((call) => [...call]),
    emitAllWindowsClosed: (): void => {
      electronGateway.emitAppEvent({ event: 'window-all-closed', args: [] });
    },
    quitCalls: (): unknown[][] => electronGateway.getQuitCalls().map((call) => [...call]),
    pageResolutionsFromBroker: (): readonly unknown[][] =>
      resolveGateway.getCallsFor({ specifier: PAGE_SPECIFIER, fromPath: brokerFilePath }),
    preloadPath: (): string => join(__dirname, '../../../../bin/desktop-preload.js'),
    setupWindowStateFound: ({ repoPath, state }: { repoPath: string; state: WindowState }): void => {
      windowStateLoadProxy.setupStateFound({ repoPath, state });
    },
    setupWindowStateMissing: ({ repoPath }: { repoPath: string }): void => {
      windowStateLoadProxy.setupStateMissing({ repoPath });
    },
    setupWindowSave: ({ repoPath }: { repoPath: string }): void => {
      windowStateSaveProxy.setupSaveSucceeds({ repoPath });
    },
    savedWindowState: async ({ repoPath }: { repoPath: string }): Promise<unknown> => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      const contents = windowStateSaveProxy.savedContents({ repoPath });

      return typeof contents === 'string' ? JSON.parse(contents) : contents;
    },
    setupDisplays: ({ displays }: { displays: readonly unknown[] }): void => {
      electronGateway.setupDisplays({ displays });
    },
    setupWindowBounds: ({
      bounds,
    }: {
      bounds: { x: number; y: number; width: number; height: number };
    }): void => {
      electronGateway.setupWindowBounds({ bounds });
    },
    setupIsMaximized: ({ value }: { value: boolean }): void => {
      electronGateway.setupIsMaximized({ value });
    },
    setupIsFullScreen: ({ value }: { value: boolean }): void => {
      electronGateway.setupIsFullScreen({ value });
    },
    emitWindowEvent: ({
      event,
      args = [],
    }: {
      event: string;
      args?: readonly unknown[];
    }): void => {
      electronGateway.emitWindowEvent({ event, args });
    },
    maximizeCalls: (): unknown[][] => electronGateway.getMaximizeCalls().map((call) => [...call]),
    setFullScreenCalls: (): unknown[][] => electronGateway.getSetFullScreenCalls().map((call) => [...call]),
  };
};
