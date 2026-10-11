import { caseSetStatics } from './case-set-statics';

describe('caseSetStatics', () => {
  describe('labels', () => {
    it('VALID: label => names the two sets Every route and Fewest runs', () => {
      expect(caseSetStatics.label).toStrictEqual({ everyRoute: 'Every route', fewestRuns: 'Fewest runs' });
    });
  });

  describe('explanations', () => {
    it('VALID: explanation => says the fewest-runs set is the one Assayer runs', () => {
      expect(caseSetStatics.explanation).toStrictEqual({
        everyRoute: 'One case for every route that can actually run. Assayer lists them all so you can check it accounted for every path.',
        fewestRuns: 'The smallest set of routes that still takes every reachable arm at least once. Assayer runs this set.',
      });
    });
  });

  describe('undriven', () => {
    it('VALID: undriven marker => reads undriven and explains the route is listed and not run', () => {
      expect({
        marker: caseSetStatics.undrivenMarker,
        colour: caseSetStatics.undrivenColour,
        explanation: caseSetStatics.undrivenExplanation,
      }).toStrictEqual({
        marker: 'undriven',
        colour: 'yellow.5',
        explanation: 'Assayer cannot steer a branch on this route, so the route is listed and not run.',
      });
    });
  });
});
