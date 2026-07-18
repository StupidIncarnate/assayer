import { undrivenLineTransformer } from './undriven-line-transformer';
import { UndrivenEntryStub } from '@assayer/shared/contracts';

// The reason strings the analysis actually carries, verbatim. Both are a welded value with one
// possible outcome — one welded into a module const, one into a call argument — and both say so,
// because the report and the window must describe one artifact the same way.
const MODULE_REASON =
  'nothing about it varies, so no case could drive its branches anywhere they do not already go: it ' +
  'runs at import time, and every operand its top-level branching turns on is welded to a value ' +
  'written in this file. No harness closes this and no feature will — a branch with one possible ' +
  'outcome is decided here, in the source, not at run time. Read an operand from the environment ' +
  'instead and Assayer drives it: a top-level `const x = Number(process.env.X)` makes X an input, ' +
  'and each arm becomes a case that sets it and imports the module fresh.';

const FIXED_ARG_REASON =
  'it is reached only through arguments fixed in the source, so no case can steer it to another ' +
  'branch: a caller welds a value into the call, and a branch with one possible outcome is decided ' +
  'there, not at run time. No harness closes this — a caller that passed its own input straight ' +
  'through instead would make each arm a case that sets it, and Assayer would drive it.';

describe('undrivenLineTransformer', () => {
  describe('rendering an undriven entry', () => {
    it('VALID: {stub entry} => names the scope and why nothing drove it', () => {
      const result = undrivenLineTransformer({ entry: UndrivenEntryStub() });

      expect(String(result)).toBe('UNDRIVEN *module* — it runs at import time, so no case drove its branches');
    });

    // The line `assayer unit` prints for sad-path/undriven-welded-const.ts, to the byte.
    it('VALID: {the module-scope entry} => matches the CLI report line exactly', () => {
      const result = undrivenLineTransformer({
        entry: UndrivenEntryStub({ name: '*module*', reason: MODULE_REASON }),
      });

      expect(String(result)).toBe(`UNDRIVEN *module* — ${MODULE_REASON}`);
    });

    // The line `assayer unit` prints for sad-path/undriven-welded-arg.ts, to the byte.
    it('VALID: {the fixed-arg private entry} => matches the CLI report line exactly', () => {
      const result = undrivenLineTransformer({
        entry: UndrivenEntryStub({ name: 'decide', reason: FIXED_ARG_REASON }),
      });

      expect(String(result)).toBe(`UNDRIVEN decide — ${FIXED_ARG_REASON}`);
    });

    // The reason is authored where the fact is found and passed through untouched. Rewording it here
    // is how the report and the window start disagreeing about one artifact.
    it('VALID: {an arbitrary reason} => passes the reason through verbatim', () => {
      const result = undrivenLineTransformer({
        entry: UndrivenEntryStub({ name: 'helper', reason: 'some future reason Assayer has not written yet' }),
      });

      expect(String(result)).toBe('UNDRIVEN helper — some future reason Assayer has not written yet');
    });
  });
});
