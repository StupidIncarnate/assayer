import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-arrow-property-cond-const', () => {
    it('VALID: {cond: const} => ternary then on line 26 driven; ternary else on line 26 never run, unreachable-exit on line 26, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/object-literal/locked/boolean-arrow-property-cond-const/boolean-arrow-property-cond-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 26, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 26, driven: 'never' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 26 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
