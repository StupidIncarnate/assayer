import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-static-method-cond-eq-boolean-value-param', () => {
    it('VALID: {value: param} => ternary then on line 24 driven; ternary else on line 24 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/class/driven/boolean-static-method-cond-eq-boolean-value-param/boolean-static-method-cond-eq-boolean-value-param.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 24, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 24, driven: 'driven' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
