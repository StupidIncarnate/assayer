import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('string-statement-cond-nullish-string-value-env', () => {
    it('VALID: {value: env} => ternary then on line 24 driven; ternary else on line 24 driven; if then on line 26 driven; if else on line 26 driven, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/module/driven/string-statement-cond-nullish-string-value-env/string-statement-cond-nullish-string-value-env.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 24, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 24, driven: 'driven' }, { kind: 'if', arm: 'then', line: 26, driven: 'driven' }, { kind: 'if', arm: 'else', line: 26, driven: 'driven' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
