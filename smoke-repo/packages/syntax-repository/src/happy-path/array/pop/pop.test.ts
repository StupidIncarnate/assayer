import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'pop.ts'), 'utf8');
const relPath = 'src/happy-path/array/pop/pop.ts';

// The hermetic walk parses with strict-null-checks on, so `number | undefined` arrives as a genuine
// two-member union rather than collapsing to plain `number`. `read-type-fact-layer-transformer` has no
// dedicated case for the undefined type, so its member reads through the generic opaque path as
// `{ kind: 'unknown', text: 'undefined' }`, sitting beside the real `{ kind: 'number' }` member.
const OPTIONAL_NUMBER = { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] };

describe('array / pop — a branchless function returning `items.pop()`', () => {
  // The param types as an ARRAY of number, read structurally like element-length. The annotated return
  // is `number | undefined`, and the walk reads that as a real union — `items.pop()` genuinely can
  // return nothing on an empty array, and the analysis now says so. Branchless, so all cases reach the
  // one exit — but an array param FANS OUT over cardinality: empty / one / many. Three cases arrange
  // `items` as REAL arrays of the element type — the salient representative `[]` (empty), then the
  // grayed twins `[7]` (one) and `[7, 7]` (many). Emit order is empty/one/many so the salient case is
  // the empty array; all three RUN, `intelligent` grays the two twins. Every value is a real array so
  // `items.pop()` runs on an actual array — a scalar placeholder would throw. The values are INPUTS
  // (P4); each case asserts only that the flow REACHES the exit.
  it('VALID: {export function popLast(items: number[]): number | undefined { return items.pop() }} => array-of-number param, return read as a real optional union, three cardinality cases', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'pop.ts') }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'popLast',
          scopePath: ['*module*', 'popLast'],
          params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
          returnType: OPTIONAL_NUMBER,
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/popLast/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesPath: ['*module*/popLast/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [] }],
            salient: true,
          },
          {
            reachesPath: ['*module*/popLast/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [7] }],
            salient: false,
          },
          {
            reachesPath: ['*module*/popLast/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [7, 8] }],
            salient: false,
          },
        ],
      },
    ]);
  });

  // An array param declares no OBJECT shape, and a builtin array method call is not one of the resolver's
  // reportable callees, so nothing is admitted: no declared types, no dark spot, no undriven, no lint.
  it('VALID: {an array-typed param, a builtin array method call} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'pop.ts') }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
