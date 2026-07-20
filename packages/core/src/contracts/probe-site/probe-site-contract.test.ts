import { probeSiteContract } from './probe-site-contract';
import { ProbeSiteStub } from './probe-site.stub';

describe('probeSiteContract', () => {
  describe('valid probe sites', () => {
    it('VALID: {stub default} => parses a condition site with its offsets', () => {
      const site = ProbeSiteStub();

      expect(probeSiteContract.parse(site)).toStrictEqual({
        id: 'grade/if:BinaryExpression,id:score,GreaterThanToken,num:5#leaf',
        kind: 'cond',
        start: 64,
        end: 73,
      });
    });

    it('VALID: {kind: "exit"} => parses an exit site', () => {
      expect(probeSiteContract.parse({ id: 'grade/return@then', kind: 'exit', start: 0, end: 5 })).toStrictEqual({
        id: 'grade/return@then',
        kind: 'exit',
        start: 0,
        end: 5,
      });
    });

    it('VALID: {kind: "optional" with an elseId} => parses the two-exit optional-access site', () => {
      expect(
        probeSiteContract.parse({ id: 'len/return@then', elseId: 'len/return@else', kind: 'optional', start: 8, end: 17 }),
      ).toStrictEqual({
        id: 'len/return@then',
        elseId: 'len/return@else',
        kind: 'optional',
        start: 8,
        end: 17,
      });
    });
  });

  describe('invalid probe sites', () => {
    it('INVALID: {kind: "branch"} => throws, since only cond and exit are probed', () => {
      expect(() => {
        return probeSiteContract.parse({ id: 'x', kind: 'branch', start: 0, end: 1 });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {negative offset} => throws validation error', () => {
      expect(() => {
        return probeSiteContract.parse({ id: 'x', kind: 'cond', start: -1, end: 1 });
      }).toThrow(/greater than or equal to 0/u);
    });
  });
});
