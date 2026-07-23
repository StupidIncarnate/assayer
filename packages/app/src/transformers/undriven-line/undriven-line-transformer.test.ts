import { undrivenLineTransformer } from './undriven-line-transformer';
import { UndrivenEntryStub } from '@assayer/shared/contracts';

// The reason strings the analysis actually carries, verbatim, so the report and the window describe
// one artifact the same way. The module reason is a module scope branching on an OPAQUE operand
// (`Math.random()`); the fixed-arg reason is a private reached through a welded call argument.
const MODULE_REASON =
  'nothing about it varies, so no case could drive its branches anywhere they do not ' +
  'already go: it runs at import time, and its top-level branching turns on a value the ' +
  'analyzer can neither set nor resolve — not a parameter, not read from the environment, ' +
  'and not a literal constant it can fold, but an opaque one (a call result, an imported ' +
  'value, a computed expression). Read an operand from the environment instead and Assayer ' +
  'drives it: a top-level `const x = Number(process.env.X)` makes X an input, and each arm ' +
  'becomes a case that sets it and imports the module fresh.';

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

    // The line `assayer unit` prints for sad-path/undriven/opaque-module/opaque-module.ts, to the byte.
    // A module entry shows its LABEL (the file basename here), never the internal `*module*` the name
    // still carries.
    it('VALID: {the module-scope entry} => matches the CLI report line exactly, by its label', () => {
      const result = undrivenLineTransformer({
        entry: UndrivenEntryStub({ name: '*module*', label: 'opaque-module.ts', reason: MODULE_REASON }),
      });

      expect(String(result)).toBe(`UNDRIVEN opaque-module.ts — ${MODULE_REASON}`);
    });

    // The line `assayer unit` prints for a fixed-arg private — one reached only through a guarded call,
    // so no case can steer it — rendered by its own name, to the byte.
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
