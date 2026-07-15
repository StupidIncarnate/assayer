import { RunResultStub } from '@assayer/shared/contracts';

import { DetailShowResponder } from './detail-show-responder';
import { DetailShowResponderProxy } from './detail-show-responder.proxy';

describe('DetailShowResponder', () => {
  describe('a saved run', () => {
    it('VALID: {a known run id} => the full trace', async () => {
      const proxy = DetailShowResponderProxy();
      proxy.savedRun({ run: RunResultStub() });

      const result = await DetailShowResponder({ configDir: '/repo', argv: ['r-1784093000000'] });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/boolean/and.ts  run r-1784093000000\n' +
          '  PASSED grade(6, 2)\n' +
          '    predicted grade/return@then\n' +
          '    cond  grade/if:x#leaf.0 true  true\n' +
          '    cond  grade/if:x#leaf.1 true  true\n' +
          "    exit  grade/return@then  'pass'",
      );
    });
  });

  describe('an unknown run id', () => {
    // Named, never an empty print: silence would read as "that run passed with nothing in it".
    it('ERROR: {no saved run} => throws naming the id and how to produce one', async () => {
      const proxy = DetailShowResponderProxy();
      proxy.noSuchRun();

      await expect(DetailShowResponder({ configDir: '/repo', argv: ['nope'] })).rejects.toThrow(
        /no saved run with id 'nope'/u,
      );
    });

    it('ERROR: {no saved run} => the message says how to make one', async () => {
      const proxy = DetailShowResponderProxy();
      proxy.noSuchRun();

      await expect(DetailShowResponder({ configDir: '/repo', argv: ['nope'] })).rejects.toThrow(
        /assayer unit <path\.\.\.>/u,
      );
    });
  });

  describe('no run id', () => {
    it('ERROR: {no id given} => throws the usage', async () => {
      DetailShowResponderProxy();

      await expect(DetailShowResponder({ configDir: '/repo', argv: [] })).rejects.toThrow(/no run id given/u);
    });
  });
});
