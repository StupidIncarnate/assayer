import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'contradictory-bounds.ts'), 'utf8');
const relPath = 'src/sad-path/length/contradictory-bounds/contradictory-bounds.ts';
const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });
const tag = analysis.functions[0];

describe('length / contradictory-bounds — a length guard nested inside one that already excludes it', () => {
  it('VALID: {a length guard inside a length guard} => three exits, the innermost behind both', () => {
    expect(
      tag.exits.map((exit) => ({ arms: exit.guardPath.map((step) => String(step.arm)), line: exit.line })),
    ).toStrictEqual([
      { arms: ['then', 'then'], line: 4 },
      { arms: ['then', 'else'], line: 7 },
      { arms: ['else'], line: 10 },
    ]);
  });

  // Emptiness is proven over the INTEGERS here, and that is a fact rather than an assumption: `.length`
  // is a count by the language's own definition. So `< 1` and `> 1` leave nothing, while the identical
  // pair of bounds on a plain number would still overlap — the value axis is read over the reals,
  // because nothing in the type graph says a number is whole.
  it('VALID: {.length < 1 then .length > 1} => length predicates the solver can contradict', () => {
    expect([tag.branches[0].condition, tag.branches[1].condition]).toStrictEqual([
      expect.objectContaining({ kind: 'leaf', predicate: { kind: 'length-lt', literal: 1 } }),
      expect.objectContaining({ kind: 'leaf', predicate: { kind: 'length-gt', literal: 1 } }),
    ]);
  });

  // THE PAYOFF. `'impossible'` needs a string both shorter and longer than one character, so it gets no
  // case at all. The two live exits still get theirs, each realized from its own intersected axis:
  // '' is shorter than one character, 'a' is not.
  it('VALID: {an exit no length can reach} => no case for it, and the live exits arranged correctly', () => {
    expect({
      caseTargets: tag.cases.map((testCase) =>
        tag.exits.findIndex((exit) => exit.coverageId === testCase.reachesExit),
      ),
      arranged: tag.cases.map((testCase) => testCase.arrange),
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
    }).toStrictEqual({
      caseTargets: [1, 2],
      arranged: [
        [{ kind: 'param', param: 'word', value: '' }],
        [{ kind: 'param', param: 'word', value: 'a' }],
      ],
      darkSpots: [],
      undriven: [],
    });
  });

  // The sentence itself, pinned verbatim: error text is product surface, so it names the dead line AND
  // the guards that killed it. It rides the LINT channel because the debt is the repo's — no harness
  // and no future Assayer feature can make a string both empty and longer than one character.
  it('VALID: {a dead exit} => a lint naming the line, the guards, and both ways to fix it', () => {
    expect(
      analysis.lints.map((lint) => ({
        rule: String(lint.rule),
        name: String(lint.name),
        message: String(lint.message),
        startLine: lint.startLine,
      })),
    ).toStrictEqual([
      {
        rule: 'unreachable-exit',
        name: 'tag',
        message:
          '`tag` can never reach the exit on line 4: the guards on lines 2, 3 cannot all hold at once. Either a comparison is wrong, or this branch is dead and should be deleted.',
        startLine: 4,
      },
    ]);
  });
});
