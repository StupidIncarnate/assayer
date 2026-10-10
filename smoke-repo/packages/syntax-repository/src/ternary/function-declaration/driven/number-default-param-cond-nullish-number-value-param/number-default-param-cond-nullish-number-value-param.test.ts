import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-default-param-cond-nullish-number-value-param', () => {
    it('VALID: {value: param} => ternary then on line 22 driven; ternary else on line 22 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/function-declaration/driven/number-default-param-cond-nullish-number-value-param/number-default-param-cond-nullish-number-value-param.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 22, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 22, driven: 'driven' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
