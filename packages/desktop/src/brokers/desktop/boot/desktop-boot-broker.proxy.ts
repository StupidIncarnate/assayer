import { electronProxy } from '#gateway/npm/electron/electron.proxy';
import { join } from '#gateway/node/path';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { getPlatformProxy } from '#gateway/node/process/get-platform/get-platform.proxy';
import { pathToFileURL } from '#gateway/node/url';

const DEV_RENDERER_URL = 'http://localhost:6273';

export const desktopBootBrokerProxy = (): {
  handledChannels: () => readonly string[];
  invokeHandler: (params: { channel: string; arg?: unknown }) => Promise<unknown>;
  sentToRendererOn: (params: { channel: string }) => unknown[][];
  setupBoot: (params: { dev: boolean; headless: boolean }) => void;
  setupPlatform: (params: { value: NodeJS.Platform }) => void;
  windowCallsWith: (params: { options: unknown }) => unknown[][];
  loadedUrls: (params: { url: string }) => unknown[][];
  emitAllWindowsClosed: () => void;
  quitCalls: () => unknown[][];
  packagedRendererUrl: () => string;
  preloadPath: () => string;
} => {
  // The renderer URL a packaged run loads; this file sits beside the broker, so the relative path is
  // the same one the broker resolves.
  const packagedRendererUrl = (): string =>
    pathToFileURL(join(__dirname, '../../../../../../app/dist/index.html')).href;
  const electronGateway = electronProxy();
  const envGateway = getEnvProxy();
  const platformGateway = getPlatformProxy();

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
    // Stages the two environment flags the boot reads, and the renderer URL it will then load. A boot
    // that finds no staged URL fails, so every test that boots calls this first.
    setupBoot: ({ dev, headless }: { dev: boolean; headless: boolean }): void => {
      envGateway.setupEnv({ name: 'ASSAYER_DEV', value: dev ? '1' : undefined });
      envGateway.setupEnv({ name: 'ASSAYER_HEADLESS', value: headless ? '1' : undefined });
      electronGateway.loadUrlResolves({ url: dev ? DEV_RENDERER_URL : packagedRendererUrl() });
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
    packagedRendererUrl,
    preloadPath: (): string => join(__dirname, '../../../../bin/desktop-preload.js'),
  };
};
