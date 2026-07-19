import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'sequential-guards.ts'), 'utf8');
const relPath = 'src/sad-path/unreachable/sequential-guards/sequential-guards.ts';
const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });
const classify = analysis.functions[0];

describe('unreachable / sequential-guards — two guards on one value whose else-arms cannot both hold', () => {
  // The solver's whole input, and the reason this rung needs no analyzer work: reaching `'impossible'`
  // means failing BOTH guards, and the walk already records that as an ordered guard path of arms.
  // Whether the exit is reachable is arithmetic over this array — not a new fact to derive.
  it('VALID: {two sequential guards} => three exits, the last one guarded by both else-arms', () => {
    expect(classify.exits.map((exit) => ({ arms: exit.guardPath.map((step) => String(step.arm)), line: exit.line }))).toStrictEqual([
      { arms: ['then'], line: 3 },
      { arms: ['else', 'then'], line: 7 },
      { arms: ['else', 'else'], line: 10 },
    ]);
  });

  // The other half of the solver's input: every operator and literal, classified off node kind and
  // `getLiteralValue()`. `value >= 1` negated is `value < 1`; `value <= 1` negated is `value > 1`; the
  // two cannot hold together. Nothing here is text, so the contradiction survives any reformatting.
  it('VALID: {>= 1 then <= 1 || === 0} => predicates carry their operator and literal', () => {
    expect([
      classify.branches[0].condition,
      classify.branches[1].condition,
    ]).toStrictEqual([
      expect.objectContaining({ kind: 'leaf', predicate: { kind: 'gte', literal: 1 } }),
      expect.objectContaining({
        kind: 'or',
        left: expect.objectContaining({ predicate: { kind: 'lte', literal: 1 } }),
        right: expect.objectContaining({ predicate: { kind: 'eq', literal: 0 } }),
      }),
    ]);
  });

  // THE PAYOFF. `'impossible'` needs a value both under 1 and over 1, so it gets NO case and is named
  // instead. The two reachable exits still get theirs, arranged from the intersected guard path.
  //
  // The middle exit gets ONE case, not two. Its `||` holds two ways on paper — left true, or left
  // false and right true — but the second needs `value > 1` and `value === 0` at once, so that route
  // is impossible and only the live one is cased. The old sampling engine could not tell, and emitted
  // a duplicate claiming a flow that cannot happen.
  it('VALID: {an exit no value can reach} => no case for it, and the live exits arranged correctly', () => {
    expect({
      caseTargets: classify.cases.map((testCase) => classify.exits.findIndex((exit) => exit.coverageId === testCase.reachesExit)),
      arranged: classify.cases.map((testCase) => testCase.arrange),
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
    }).toStrictEqual({
      caseTargets: [0, 1],
      arranged: [
        [{ kind: 'param', param: 'value', value: 1 }],
        [{ kind: 'param', param: 'value', value: 0 }],
      ],
      darkSpots: [],
      undriven: [],
    });
  });

  // The sentence itself, pinned verbatim: error text is product surface, so it names the dead line AND
  // the guards that killed it. "Unreachable" alone leaves the reader hunting for which comparison to
  // fix. It rides the LINT channel because the debt is the repo's — the language cannot run this, and
  // no harness or future Assayer feature will ever change that.
  it('VALID: {a dead exit} => a lint naming the line, the guards, and both ways to fix it', () => {
    expect(analysis.lints.map((lint) => ({ rule: String(lint.rule), name: String(lint.name), message: String(lint.message), startLine: lint.startLine }))).toStrictEqual([
      {
        rule: 'unreachable-exit',
        name: 'classify',
        message:
          '`classify` can never reach the exit on line 10: the guards on lines 2, 6 cannot all hold at once. Either a comparison is wrong, or this branch is dead and should be deleted.',
        startLine: 10,
      },
    ]);
  });
});
