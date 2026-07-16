import { CompileProgressEventStub } from '@assayer/core/contracts';

import { processStdoutCompileProgressAdapter } from './process-stdout-compile-progress-adapter';
import { processStdoutCompileProgressAdapterProxy } from './process-stdout-compile-progress-adapter.proxy';

describe('processStdoutCompileProgressAdapter', () => {
  describe('first event of a compile', () => {
    // Planning is not compiling. Files are planned on every run — the working tree has no commit to
    // diff against — so announcing here would announce every run, whether or not anything is written.
    it('VALID: {namespace: "main", phase: "planned", current: 0, max: 2} => writes nothing yet, having compiled nothing yet', () => {
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

      expect(proxy.getWrites()).toStrictEqual([]);
    });

    it('VALID: {planned main 0/2, then advanced main 1/2 compiled} => writes the header once then the bar', () => {
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
          namespace: 'main',
          branch: 'main',
          phase: 'advanced',
          current: 1,
          max: 2,
          stableMax: 2,
          currentMax: 2,
          reused: false,
        }),
      });

      expect(proxy.getWrites()).toStrictEqual([
        'Assayer is updating caches\n',
        'main: ##########---------- 1/2\n',
      ]);
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
          reused: false,
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
          reused: false,
        }),
      });

      // The two 'planned' events drew nothing — planning is not compiling — but they still REGISTERED
      // both namespaces, so develop has its bar from the moment drawing starts.
      expect(proxy.getWrites()).toStrictEqual([
        'Assayer is updating caches\n',
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
          reused: false,
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
          reused: false,
        }),
      });

      expect(proxy.getWrites()).toStrictEqual([
        'Assayer is updating caches\n',
        'main: #################### 1/1\n',
        'develop: -------------------- 0/1\n',
        'main: #################### 1/1\n',
        'develop: #################### 1/1\n',
      ]);
    });
  });

  describe('a run in which every file was already cached', () => {
    // The working-tree namespace has no commit to diff against, so it re-reads and re-hashes every
    // file on every run and events arrive for files nobody touched. Announcing "updating caches" for
    // them claimed work that never happened — not one blob or manifest byte is written on this path.
    it('EMPTY: {every file reused} => writes nothing at all, rather than announcing an update', () => {
      const proxy = processStdoutCompileProgressAdapterProxy();
      const controller = processStdoutCompileProgressAdapter();

      controller.render({
        event: CompileProgressEventStub({
          namespace: 'main',
          branch: 'main',
          phase: 'advanced',
          current: 1,
          max: 2,
          stableMax: 2,
          currentMax: 2,
          reused: true,
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
          reused: true,
        }),
      });

      expect(proxy.getWrites()).toStrictEqual([]);
    });
  });

  describe('a run in which only some files changed', () => {
    // Events carry the ABSOLUTE count, so the bar is true the first time it is drawn even though the
    // reused files ahead of it drew nothing — 2/2, not a bar restarted at 1.
    it('VALID: {file 1 reused, file 2 compiled} => announces at the first real compile, counting every file', () => {
      const proxy = processStdoutCompileProgressAdapterProxy();
      const controller = processStdoutCompileProgressAdapter();

      controller.render({
        event: CompileProgressEventStub({
          namespace: 'main',
          branch: 'main',
          phase: 'advanced',
          current: 1,
          max: 2,
          stableMax: 2,
          currentMax: 2,
          reused: true,
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
          reused: false,
        }),
      });

      expect(proxy.getWrites()).toStrictEqual([
        'Assayer is updating caches\n',
        'main: #################### 2/2\n',
      ]);
    });
  });

  describe('TTY output redraws bars in place', () => {
    // Two COMPILED events, because the cursor only moves for a REDRAW: the first bar drawn has
    // nothing above it to overwrite, however many silent events came before it.
    it('VALID: {tty; advanced main 1/2 then advanced main 2/2} => moves the cursor up before redrawing the bar', () => {
      const proxy = processStdoutCompileProgressAdapterProxy();
      proxy.enableTty();
      const controller = processStdoutCompileProgressAdapter();

      controller.render({
        event: CompileProgressEventStub({
          namespace: 'main',
          branch: 'main',
          phase: 'advanced',
          current: 1,
          max: 2,
          stableMax: 2,
          currentMax: 2,
          reused: false,
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
          reused: false,
        }),
      });

      expect(proxy.getWrites()).toStrictEqual([
        'Assayer is updating caches\n',
        'main: ##########---------- 1/2\n',
        '\u001b[1A',
        'main: #################### 2/2\n',
      ]);
    });
  });
});
