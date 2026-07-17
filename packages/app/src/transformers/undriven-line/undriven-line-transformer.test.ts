import { undrivenLineTransformer } from './undriven-line-transformer';
import { UndrivenEntryStub } from '@assayer/shared/contracts';

// The reason strings the analysis actually carries, verbatim. They are DIFFERENT sentences because
// they are different debts, and only one of them names a feature: a welded const is decided at
// authoring time, so nothing will ever drive it and the reason says what to change instead, while a
// private is merely out of reach of a call-graph follower that does not exist yet.
const MODULE_REASON =
  'nothing about it varies, so no case could drive its branches anywhere they do not already go: it ' +
  'runs at import time, and every operand its top-level branching turns on is welded to a value ' +
  'written in this file. No harness closes this and no feature will — a branch with one possible ' +
  'outcome is decided here, in the source, not at run time. Read an operand from the environment ' +
  'instead and Assayer drives it: a top-level `const x = Number(process.env.X)` makes X an input, ' +
  'and each arm becomes a case that sets it and imports the module fresh.';

const PRIVATE_REASON =
  'it is not exported, so nothing outside the module can call it and no case drove its branches. No ' +
  'harness closes this — driving a private directly is not a test anyone wants, and covering it THROUGH ' +
  'the callers that do reach it needs call-graph following, which Assayer does not do yet.';

describe('undrivenLineTransformer', () => {
  describe('rendering an undriven entry', () => {
    it('VALID: {stub entry} => names the scope and why nothing drove it', () => {
      const result = undrivenLineTransformer({ entry: UndrivenEntryStub() });

      expect(String(result)).toBe('UNDRIVEN *module* — it runs at import time, so no case drove its branches');
    });

    // The line `assayer unit` prints for undriven/welded-operand.ts, to the byte.
    it('VALID: {the module-scope entry} => matches the CLI report line exactly', () => {
      const result = undrivenLineTransformer({
        entry: UndrivenEntryStub({ name: '*module*', reason: MODULE_REASON }),
      });

      expect(String(result)).toBe(`UNDRIVEN *module* — ${MODULE_REASON}`);
    });

    // The line `assayer unit` prints for undriven/private-function.ts, to the byte.
    it('VALID: {the private-helper entry} => matches the CLI report line exactly', () => {
      const result = undrivenLineTransformer({
        entry: UndrivenEntryStub({ name: 'decide', reason: PRIVATE_REASON }),
      });

      expect(String(result)).toBe(`UNDRIVEN decide — ${PRIVATE_REASON}`);
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
