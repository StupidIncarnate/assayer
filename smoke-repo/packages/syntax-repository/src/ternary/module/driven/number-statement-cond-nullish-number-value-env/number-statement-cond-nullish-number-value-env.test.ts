import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-statement-cond-nullish-number-value-env', () => {
    it('VALID: {value: env} => ternary then on line 24 driven; ternary else on line 24 driven; ternary then on line 26 driven; ternary else on line 26 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/module/driven/number-statement-cond-nullish-number-value-env/number-statement-cond-nullish-number-value-env.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 24, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 24, driven: 'driven' }, { kind: 'ternary', arm: 'then', line: 26, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 26, driven: 'driven' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
