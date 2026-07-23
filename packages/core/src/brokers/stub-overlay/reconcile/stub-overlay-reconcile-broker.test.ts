import { StubIndexStub, EnvStubStub, StubOverlayStub } from '@assayer/shared/contracts';

import { stubOverlayReconcileBroker } from './stub-overlay-reconcile-broker';
import { stubOverlayReconcileBrokerProxy } from './stub-overlay-reconcile-broker.proxy';

describe('stubOverlayReconcileBroker', () => {
  describe('an overlay that still resolves', () => {
    it('VALID: {object overlay for a type in the index naming a real property} => no errors', () => {
      stubOverlayReconcileBrokerProxy();

      const result = stubOverlayReconcileBroker({ index: StubIndexStub(), overlays: [StubOverlayStub()] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {env overlay for a property in the env stubs} => no errors', () => {
      stubOverlayReconcileBrokerProxy();
      const index = StubIndexStub({ objectStubs: [], envStubs: [EnvStubStub()] });
      const overlay = StubOverlayStub({
        kind: 'env',
        key: 'process.env#MODE',
        overlayPath: 'assayer/stubs/env/MODE.json',
        property: 'MODE',
        values: ['x'],
      });

      const result = stubOverlayReconcileBroker({ index, overlays: [overlay] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('an object overlay whose type no longer exists', () => {
    it("ERROR: {object overlay keyed src/gone.ts#Gone, absent from the index} => one 'no longer exists' P1 naming the overlay file and identity", () => {
      stubOverlayReconcileBrokerProxy();
      const overlay = StubOverlayStub({
        key: 'src/gone.ts#Gone',
        overlayPath: 'assayer/stubs/objects/src/gone.ts/Gone.json',
      });

      const result = stubOverlayReconcileBroker({ index: StubIndexStub(), overlays: [overlay] });

      expect(result).toStrictEqual([
        {
          relPath: 'assayer/stubs/objects/src/gone.ts/Gone.json',
          line: 1,
          column: 1,
          message: "type 'src/gone.ts#Gone' no longer exists (renamed, moved, or deleted) — rectify this stub",
        },
      ]);
    });
  });

  describe('an object overlay naming a property the type no longer has', () => {
    it("ERROR: {object overlay for Config naming 'retries', which is not on Config} => one 'not on type' P1 naming the property and identity", () => {
      stubOverlayReconcileBrokerProxy();
      const overlay = StubOverlayStub({ properties: [{ name: 'retries', values: ['3'] }] });

      const result = stubOverlayReconcileBroker({ index: StubIndexStub(), overlays: [overlay] });

      expect(result).toStrictEqual([
        {
          relPath: 'assayer/stubs/objects/src/config/config.ts/Config.json',
          line: 1,
          column: 1,
          message: "property 'retries' is not on type 'src/config/config.ts#Config' — rectify this stub",
        },
      ]);
    });
  });

  describe('an env overlay whose property is no longer read', () => {
    it("ERROR: {env overlay keyed process.env#GONE, absent from the env stubs} => one 'no longer read anywhere' P1 naming the overlay file and property", () => {
      stubOverlayReconcileBrokerProxy();
      const overlay = StubOverlayStub({
        kind: 'env',
        key: 'process.env#GONE',
        overlayPath: 'assayer/stubs/env/GONE.json',
        property: 'GONE',
        values: ['x'],
      });

      const result = stubOverlayReconcileBroker({ index: StubIndexStub({ objectStubs: [], envStubs: [] }), overlays: [overlay] });

      expect(result).toStrictEqual([
        {
          relPath: 'assayer/stubs/env/GONE.json',
          line: 1,
          column: 1,
          message: "env property 'GONE' is no longer read anywhere (renamed or deleted) — rectify this stub",
        },
      ]);
    });
  });

  describe('two stale overlays supplied out of order', () => {
    it('ERROR: {two missing-type overlays in reverse key order} => both reported, sorted deterministically', () => {
      stubOverlayReconcileBrokerProxy();
      const later = StubOverlayStub({ key: 'src/b.ts#B', overlayPath: 'assayer/stubs/objects/src/b.ts/B.json' });
      const earlier = StubOverlayStub({ key: 'src/a.ts#A', overlayPath: 'assayer/stubs/objects/src/a.ts/A.json' });

      const result = stubOverlayReconcileBroker({ index: StubIndexStub(), overlays: [later, earlier] });

      expect(result).toStrictEqual([
        {
          relPath: 'assayer/stubs/objects/src/a.ts/A.json',
          line: 1,
          column: 1,
          message: "type 'src/a.ts#A' no longer exists (renamed, moved, or deleted) — rectify this stub",
        },
        {
          relPath: 'assayer/stubs/objects/src/b.ts/B.json',
          line: 1,
          column: 1,
          message: "type 'src/b.ts#B' no longer exists (renamed, moved, or deleted) — rectify this stub",
        },
      ]);
    });
  });
});
