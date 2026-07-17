import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'if-in-switch.ts'), 'utf8');

const GET = '*module*/describeRoute/switch:id:method,EqualsEqualsEqualsToken,str:get';
const IF = '*module*/describeRoute/if:BinaryExpression,id:size,GreaterThanToken,num:5';

describe('composition / if-in-switch — an if nested inside a switch case', () => {
  // Composition holds in BOTH directions, and neither handler knows the other exists: the guard is
  // simply whatever the walk carried down. The early-return rule also survives nesting — the
  // `return 'small read'` after the inner if is guarded by that if's else, inside the case arm.
  it('VALID: {if inside a switch case} => exits carry the case guard then the if guard', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/composition/if-in-switch.ts' });
    const guards = result.success
      ? result.functions.flatMap((fn) => fn.exits).map((exit) => exit.guardPath.map((step) => `${step.branchCoverageId}#${step.arm}`))
      : [];

    expect(guards).toStrictEqual([
      [`${GET}#then`, `${IF}#then`],
      [`${GET}#then`, `${IF}#else`],
      [`${GET}#else`],
    ]);
  });
});
