import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-static-field-cond-nullish-boolean-value-env', () => {
    it('VALID: {value: env} => ternary then on line 24 driven; ternary else on line 24 driven; ternary then on line 27 driven; ternary else on line 27 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/class/driven/boolean-static-field-cond-nullish-boolean-value-env/boolean-static-field-cond-nullish-boolean-value-env.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 24, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 24, driven: 'driven' }, { kind: 'ternary', arm: 'then', line: 27, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 27, driven: 'driven' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
