import { CompileProgressEventStub } from '@assayer/core/contracts';

import { processStdoutCompileProgressAdapter } from './process-stdout-compile-progress-adapter';
import { processStdoutCompileProgressAdapterProxy } from './process-stdout-compile-progress-adapter.proxy';

describe('processStdoutCompileProgressAdapter', () => {
  describe('first event of a compile', () => {
    it('VALID: {namespace: "main", phase: "planned", current: 0, max: 2} => writes the header once then one empty bar line', () => {
      const proxy = processStdoutCompileProgressAdapterProxy();
      const controller = processStdoutCompileProgressAdapter();

      controller.render({
        event: CompileProgressEventStub({
          namespace: 'main',
          branch: 'main',
          phase: 'planned',
          current: 0,
          max: 2,
          stableMax: 2,
          currentMax: 2,
        }),
      });

      expect(proxy.getWrites()).toStrictEqual(['Assayer is updating caches\n', 'main: -------------------- 0/2\n']);
    });
  });

  describe('stable namespace advances to full while the current namespace stays at zero', () => {
    it('VALID: {planned main, planned develop, advanced main 1/2, advanced main 2/2} => redraws main then develop every event, main reaching 2/2 before develop starts', () => {
      const proxy = processStdoutCompileProgressAdapterProxy();
      const controller = processStdoutCompileProgressAdapter();

      controller.render({
        event: CompileProgressEventStub({
          namespace: 'main',
          branch: 'main',
          phase: 'planned',
          current: 0,
          max: 2,
          stableMax: 2,
          currentMax: 2,
        }),
      });
      controller.render({
        event: CompileProgressEventStub({
          namespace: 'develop',
          branch: 'develop',
          phase: 'planned',
          current: 0,
          max: 2,
          stableMax: 2,
          currentMax: 2,
        }),
      });
      controller.render({
        event: CompileProgressEventStub({
          namespace: 'main',
          branch: 'main',
          phase: 'advanced',
          current: 1,
          max: 2,
          stableMax: 2,
          currentMax: 2,
        }),
      });
      controller.render({
        event: CompileProgressEventStub({
          namespace: 'main',
          branch: 'main',
          phase: 'advanced',
          current: 2,
          max: 2,
          stableMax: 2,
          currentMax: 2,
        }),
      });

      expect(proxy.getWrites()).toStrictEqual([
        'Assayer is updating caches\n',
        'main: -------------------- 0/2\n',
        'main: -------------------- 0/2\n',
        'develop: -------------------- 0/2\n',
        'main: ##########---------- 1/2\n',
        'develop: -------------------- 0/2\n',
        'main: #################### 2/2\n',
        'develop: -------------------- 0/2\n',
      ]);
    });
  });

  describe('current namespace only advances after the stable namespace fully advances', () => {
    it('VALID: {planned main, planned develop, advanced main 1/1, advanced develop 1/1} => main reaches 1/1 before develop ever advances past 0/1', () => {
      const proxy = processStdoutCompileProgressAdapterProxy();
      const controller = processStdoutCompileProgressAdapter();

      controller.render({
        event: CompileProgressEventStub({
          namespace: 'main',
          branch: 'main',
          phase: 'planned',
          current: 0,
          max: 1,
          stableMax: 1,
          currentMax: 1,
        }),
      });
      controller.render({
        event: CompileProgressEventStub({
          namespace: 'develop',
          branch: 'develop',
          phase: 'planned',
          current: 0,
          max: 1,
          stableMax: 1,
          currentMax: 1,
        }),
      });
      controller.render({
        event: CompileProgressEventStub({
          namespace: 'main',
          branch: 'main',
          phase: 'advanced',
          current: 1,
          max: 1,
          stableMax: 1,
          currentMax: 1,
        }),
      });
      controller.render({
        event: CompileProgressEventStub({
          namespace: 'develop',
          branch: 'develop',
          phase: 'advanced',
          current: 1,
          max: 1,
          stableMax: 1,
          currentMax: 1,
        }),
      });

      expect(proxy.getWrites()).toStrictEqual([
        'Assayer is updating caches\n',
        'main: -------------------- 0/1\n',
        'main: -------------------- 0/1\n',
        'develop: -------------------- 0/1\n',
        'main: #################### 1/1\n',
        'develop: -------------------- 0/1\n',
        'main: #################### 1/1\n',
        'develop: #################### 1/1\n',
      ]);
    });
  });

  describe('TTY output redraws bars in place', () => {
    it('VALID: {tty; planned main 0/2 then advanced main 1/2} => moves the cursor up before redrawing the bar', () => {
      const proxy = processStdoutCompileProgressAdapterProxy();
      proxy.enableTty();
      const controller = processStdoutCompileProgressAdapter();

      controller.render({
        event: CompileProgressEventStub({
          namespace: 'main',
          branch: 'main',
          phase: 'planned',
          current: 0,
          max: 2,
          stableMax: 2,
          currentMax: 2,
        }),
      });
      controller.render({
        event: CompileProgressEventStub({
          namespace: 'main',
          branch: 'main',
          phase: 'advanced',
          current: 1,
          max: 2,
          stableMax: 2,
          currentMax: 2,
        }),
      });

      expect(proxy.getWrites()).toStrictEqual([
        'Assayer is updating caches\n',
        'main: -------------------- 0/2\n',
        '[1A',
        'main: ##########---------- 1/2\n',
      ]);
    });
  });
});
