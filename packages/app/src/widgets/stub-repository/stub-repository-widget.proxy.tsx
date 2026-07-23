import { useStubIndexBindingProxy } from '../../bindings/use-stub-index/use-stub-index-binding.proxy';
import type { StubViewStub } from '@assayer/shared/contracts';

export const StubRepositoryWidgetProxy = (): {
  setupView: (params: { view: ReturnType<typeof StubViewStub> }) => void;
  failView: (params: { message: string }) => void;
} => {
  const bindingProxy = useStubIndexBindingProxy();

  return {
    setupView: ({ view }: { view: ReturnType<typeof StubViewStub> }): void => {
      bindingProxy.setupView({ view });
    },
    // Takes the message a real resolver would raise, so the test can assert the widget prints THAT
    // sentence rather than one the widget composed.
    failView: ({ message }: { message: string }): void => {
      bindingProxy.rejects({ error: new Error(message) });
    },
  };
};
