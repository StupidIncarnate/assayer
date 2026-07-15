import { traceEventContract } from './trace-event-contract';
import { TraceEventStub } from './trace-event.stub';

describe('traceEventContract', () => {
  describe('valid events', () => {
    it('VALID: {a cond event} => parses with its boolean outcome and display text', () => {
      expect(traceEventContract.parse(TraceEventStub())).toStrictEqual({
        id: 'grade/if:BinaryExpression,id:score,GreaterThanToken,num:5#leaf.0',
        kind: 'cond',
        outcome: true,
        valueText: 'true',
      });
    });

    // An exit carries no outcome: it did not decide anything, it IS the thing that happened.
    it('VALID: {an exit event} => parses without an outcome', () => {
      expect(traceEventContract.parse({ id: 'grade/return@then', kind: 'exit', valueText: "'pass'" })).toStrictEqual({
        id: 'grade/return@then',
        kind: 'exit',
        valueText: "'pass'",
      });
    });
  });

  describe('invalid events', () => {
    it('INVALID: {kind: "branch"} => throws, since only cond and exit are traced', () => {
      expect(() => {
        return traceEventContract.parse({ id: 'x', kind: 'branch', valueText: '1' });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {no valueText} => throws, since an event with no rendering cannot be displayed', () => {
      expect(() => {
        return traceEventContract.parse({ id: 'x', kind: 'exit' });
      }).toThrow(/Required/u);
    });
  });
});
