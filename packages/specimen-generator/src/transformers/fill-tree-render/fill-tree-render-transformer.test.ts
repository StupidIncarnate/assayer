import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { fillTreeRenderTransformer } from './fill-tree-render-transformer';

const IF_PROGRAM = ProgramStub({
  code: `export const ifSyntax = syntax({
  description: 'an if statement whose else falls through to the code after it',
  code: <T>(cond: T): void => {
    if (cond) {
      $arm('then');
    }
    $arm('else');
  },
});
`,
  fileName: 'if.syntax.ts',
});
const IF_INSTANCES = IF_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: IF_PROGRAM.getTypeChecker(),
        declared: { description: 'an if statement', code: () => undefined },
        origin: 'syntax',
        typeArguments: ['boolean', 'number'],
      }),
    ],
  }),
);

const GT_PROGRAM = ProgramStub({
  code: `export const gtSyntax = syntax({
  description: 'a value compared with a limit using >',
  code: <T extends number | string>(value: T, limit: T): boolean => value > limit,
});
`,
  fileName: 'gt.syntax.ts',
});
const GT_INSTANCES = GT_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: GT_PROGRAM.getTypeChecker(),
        declared: { description: 'a value compared with a limit using >', code: () => true },
        origin: 'syntax',
        typeArguments: ['number'],
      }),
    ],
  }),
);

const NOT_PROGRAM = ProgramStub({
  code: `export const notSyntax = syntax({
  description: 'a negation',
  code: (value: boolean): boolean => !value,
});
`,
  fileName: 'not.syntax.ts',
});
const NOT_INSTANCES = NOT_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: NOT_PROGRAM.getTypeChecker(),
        declared: { description: 'a negation', code: () => true },
        origin: 'syntax',
        typeArguments: ['boolean'],
      }),
    ],
  }),
);

const TERNARY_PROGRAM = ProgramStub({
  code: `export const ternarySyntax = syntax({
  description: 'a conditional expression',
  code: <T>(cond: T): string => (cond ? $arm('then') : $arm('else')),
});
`,
  fileName: 'ternary.syntax.ts',
});
const TERNARY_INSTANCES = TERNARY_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: TERNARY_PROGRAM.getTypeChecker(),
        declared: { description: 'a conditional expression', code: () => 'then' },
        origin: 'syntax',
        typeArguments: ['boolean', 'number'],
      }),
    ],
  }),
);

const AT_PROGRAM = ProgramStub({
  code: `export const arrayAtShim = shim({
  description: 'reads one element of an array',
  builtin: 'Array.prototype.at',
  form: { kind: 'method', name: 'at' },
  code: <T>(receiver: readonly T[], index: number): T | undefined => receiver[index],
});
`,
  fileName: 'array-at.shim.ts',
});
const AT_INSTANCES = AT_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: AT_PROGRAM.getTypeChecker(),
        declared: {
          description: 'reads one element of an array',
          builtin: 'Array.prototype.at',
          form: { kind: 'method', name: 'at' },
          code: () => undefined,
        },
        origin: 'shim',
        typeArguments: ['number'],
      }),
    ],
  }),
);

const LENGTH_PROGRAM = ProgramStub({
  code: `export const arrayLengthShim = shim({
  description: 'the number of elements in an array',
  builtin: 'Array.prototype.length',
  form: { kind: 'getter', name: 'length' },
  code: <T>(receiver: readonly T[]): number => receiver.length,
});
`,
  fileName: 'array-length.shim.ts',
});
const LENGTH_INSTANCES = LENGTH_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: LENGTH_PROGRAM.getTypeChecker(),
        declared: {
          description: 'the number of elements in an array',
          builtin: 'Array.prototype.length',
          form: { kind: 'getter', name: 'length' },
          code: () => 0,
        },
        origin: 'shim',
        typeArguments: ['number'],
      }),
    ],
  }),
);

const NOOP_PROGRAM = ProgramStub({
  code: `export const noopSyntax = syntax({
  description: 'a statement with no arms',
  code: (value: number): void => {
    void value;
  },
});
`,
  fileName: 'noop.syntax.ts',
});
const NOOP_INSTANCES = NOOP_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: NOOP_PROGRAM.getTypeChecker(),
        declared: { description: 'a statement with no arms', code: () => undefined },
        origin: 'syntax',
        typeArguments: ['number'],
      }),
    ],
  }),
);

const STATEMENT_IN_HOLE_TREES: Parameters<typeof fillTreeRenderTransformer>[0]['tree'][] = GT_INSTANCES.flatMap(
  (gtInstance) =>
    NOOP_INSTANCES.map((noopInstance) => ({
      kind: 'node',
      instance: gtInstance,
      holes: {
        value: {
          kind: 'node',
          instance: noopInstance,
          holes: {
            value: { kind: 'leaf', owner: 'noop', hole: 'value', type: 'number', provenance: 'param', value: 3 },
          },
        },
        limit: { kind: 'leaf', owner: 'gt', hole: 'limit', type: 'number', provenance: 'literal', value: 5 },
      },
    })),
);

const IF_GT_LENGTH_TREES: Parameters<typeof fillTreeRenderTransformer>[0]['tree'][] = IF_INSTANCES.filter(
  (instance) => instance.typeArgument === 'boolean',
).flatMap((ifInstance) =>
  GT_INSTANCES.flatMap((gtInstance) =>
    LENGTH_INSTANCES.map((lengthInstance) => ({
      kind: 'node',
      instance: ifInstance,
      holes: {
        cond: {
          kind: 'node',
          instance: gtInstance,
          holes: {
            value: {
              kind: 'node',
              instance: lengthInstance,
              holes: {
                receiver: {
                  kind: 'leaf',
                  owner: 'array-length',
                  hole: 'receiver',
                  type: 'readonly number[]',
                  provenance: 'param',
                  value: [10, 20, 30],
                },
              },
            },
            limit: { kind: 'leaf', owner: 'gt', hole: 'limit', type: 'number', provenance: 'literal', value: 5 },
          },
        },
      },
    })),
  ),
);

describe('fillTreeRenderTransformer', () => {
  it('VALID: {if over gt, value is a param, armKind: return} => writes the if with return arms and one parameter', () => {
    const results = IF_INSTANCES.filter((instance) => instance.typeArgument === 'boolean').flatMap((ifInstance) =>
      GT_INSTANCES.map((gtInstance) =>
        fillTreeRenderTransformer({
          tree: {
            kind: 'node',
            instance: ifInstance,
            holes: {
              cond: {
                kind: 'node',
                instance: gtInstance,
                holes: {
                  value: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'param', value: 3 },
                  limit: { kind: 'leaf', owner: 'gt', hole: 'limit', type: 'number', provenance: 'literal', value: 5 },
                },
              },
            },
          },
          armKind: 'return',
        }),
      ),
    );

    expect(results).toStrictEqual([
      {
        text: "if (value > 5) {\n    return 'then';\n}\nreturn 'else';",
        params: [{ name: 'value', type: 'number' }],
        declarations: [],
      },
    ]);
  });

  it('VALID: {if over gt, value is a const, armKind: return} => writes the same if and declares the const with its type', () => {
    const results = IF_INSTANCES.filter((instance) => instance.typeArgument === 'boolean').flatMap((ifInstance) =>
      GT_INSTANCES.map((gtInstance) =>
        fillTreeRenderTransformer({
          tree: {
            kind: 'node',
            instance: ifInstance,
            holes: {
              cond: {
                kind: 'node',
                instance: gtInstance,
                holes: {
                  value: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'const', value: 3 },
                  limit: { kind: 'leaf', owner: 'gt', hole: 'limit', type: 'number', provenance: 'literal', value: 5 },
                },
              },
            },
          },
          armKind: 'return',
        }),
      ),
    );

    expect(results).toStrictEqual([
      {
        text: "if (value > 5) {\n    return 'then';\n}\nreturn 'else';",
        params: [],
        declarations: [{ name: 'value', text: 'const value: number = 3;' }],
      },
    ]);
  });

  it('VALID: {if over gt, value is env, armKind: log} => writes console.log arms and declares the env read', () => {
    const results = IF_INSTANCES.filter((instance) => instance.typeArgument === 'boolean').flatMap((ifInstance) =>
      GT_INSTANCES.map((gtInstance) =>
        fillTreeRenderTransformer({
          tree: {
            kind: 'node',
            instance: ifInstance,
            holes: {
              cond: {
                kind: 'node',
                instance: gtInstance,
                holes: {
                  value: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'env', value: 3 },
                  limit: { kind: 'leaf', owner: 'gt', hole: 'limit', type: 'number', provenance: 'literal', value: 5 },
                },
              },
            },
          },
          armKind: 'log',
        }),
      ),
    );

    expect(results).toStrictEqual([
      {
        text: "if (value > 5) {\n    console.log('then');\n}\nconsole.log('else');",
        params: [],
        declarations: [{ name: 'value', text: 'const value = Number(process.env.VALUE);' }],
      },
    ]);
  });

  it('VALID: {if over gt, value is a param, armKind: yield} => writes yield arms', () => {
    const results = IF_INSTANCES.filter((instance) => instance.typeArgument === 'boolean').flatMap((ifInstance) =>
      GT_INSTANCES.map((gtInstance) =>
        fillTreeRenderTransformer({
          tree: {
            kind: 'node',
            instance: ifInstance,
            holes: {
              cond: {
                kind: 'node',
                instance: gtInstance,
                holes: {
                  value: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'param', value: 3 },
                  limit: { kind: 'leaf', owner: 'gt', hole: 'limit', type: 'number', provenance: 'literal', value: 5 },
                },
              },
            },
          },
          armKind: 'yield',
        }),
      ),
    );

    expect(results).toStrictEqual([
      {
        text: "if (value > 5) {\n    yield 'then';\n}\nyield 'else';",
        params: [{ name: 'value', type: 'number' }],
        declarations: [],
      },
    ]);
  });

  it('VALID: {if with an external condition} => writes the process.argv read inline and needs nothing', () => {
    const results = IF_INSTANCES.filter((instance) => instance.typeArgument === 'number').map((ifInstance) =>
      fillTreeRenderTransformer({
        tree: {
          kind: 'node',
          instance: ifInstance,
          holes: {
            cond: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'external', value: 3 },
          },
        },
        armKind: 'return',
      }),
    );

    expect(results).toStrictEqual([
      {
        text: "if (Number(process.argv[2])) {\n    return 'then';\n}\nreturn 'else';",
        params: [],
        declarations: [],
      },
    ]);
  });

  it('VALID: {if over gt over array length of a param} => writes receiver.length and takes the array as a parameter', () => {
    const results = IF_GT_LENGTH_TREES.map((tree) => fillTreeRenderTransformer({ tree, armKind: 'return' }));

    expect(results).toStrictEqual([
      {
        text: "if (receiver.length > 5) {\n    return 'then';\n}\nreturn 'else';",
        params: [{ name: 'receiver', type: 'readonly number[]' }],
        declarations: [],
      },
    ]);
  });

  it('ERROR: {if, no armKind} => throws and says the arm needs a statement slot', () => {
    expect(() =>
      IF_INSTANCES.filter((instance) => instance.typeArgument === 'number').map((ifInstance) =>
        fillTreeRenderTransformer({
          tree: {
            kind: 'node',
            instance: ifInstance,
            holes: {
              cond: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'param', value: 3 },
            },
          },
        }),
      ),
    ).toThrow(
      /^The arm 'then' of the syntax 'if-number' needs a statement slot, because it is written as a statement\. Put this syntax in a slot that has an arm, or use an expression syntax\.$/u,
    );
  });

  it('VALID: {ternary over gt, value is a param} => writes the conditional without outer parentheses', () => {
    const results = TERNARY_INSTANCES.filter((instance) => instance.typeArgument === 'boolean').flatMap(
      (ternaryInstance) =>
        GT_INSTANCES.map((gtInstance) =>
          fillTreeRenderTransformer({
            tree: {
              kind: 'node',
              instance: ternaryInstance,
              holes: {
                cond: {
                  kind: 'node',
                  instance: gtInstance,
                  holes: {
                    value: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'param', value: 3 },
                    limit: {
                      kind: 'leaf',
                      owner: 'gt',
                      hole: 'limit',
                      type: 'number',
                      provenance: 'literal',
                      value: 5,
                    },
                  },
                },
              },
            },
          }),
        ),
    );

    expect(results).toStrictEqual([
      {
        text: "value > 5 ? 'then' : 'else'",
        params: [{ name: 'value', type: 'number' }],
        declarations: [],
      },
    ]);
  });

  it('VALID: {ternary with an env condition} => writes the condition by its name and declares the env read', () => {
    const results = TERNARY_INSTANCES.filter((instance) => instance.typeArgument === 'number').map(
      (ternaryInstance) =>
        fillTreeRenderTransformer({
          tree: {
            kind: 'node',
            instance: ternaryInstance,
            holes: {
              cond: { kind: 'leaf', owner: 'ternary', hole: 'cond', type: 'number', provenance: 'env', value: 3 },
            },
          },
        }),
    );

    expect(results).toStrictEqual([
      {
        text: "cond ? 'then' : 'else'",
        params: [],
        declarations: [{ name: 'cond', text: 'const cond = Number(process.env.COND);' }],
      },
    ]);
  });

  it('VALID: {not over gt} => parenthesizes the comparison inside the negation', () => {
    const results = NOT_INSTANCES.flatMap((notInstance) =>
      GT_INSTANCES.map((gtInstance) =>
        fillTreeRenderTransformer({
          tree: {
            kind: 'node',
            instance: notInstance,
            holes: {
              value: {
                kind: 'node',
                instance: gtInstance,
                holes: {
                  value: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'param', value: 3 },
                  limit: { kind: 'leaf', owner: 'gt', hole: 'limit', type: 'number', provenance: 'literal', value: 5 },
                },
              },
            },
          },
        }),
      ),
    );

    expect(results).toStrictEqual([
      { text: '!(value > 5)', params: [{ name: 'value', type: 'number' }], declarations: [] },
    ]);
  });

  it('VALID: {array-at whose index is the array-length of a second array} => names the second array from its owner', () => {
    const results = AT_INSTANCES.flatMap((atInstance) =>
      LENGTH_INSTANCES.map((lengthInstance) =>
        fillTreeRenderTransformer({
          tree: {
            kind: 'node',
            instance: atInstance,
            holes: {
              receiver: {
                kind: 'leaf',
                owner: 'array-at',
                hole: 'receiver',
                type: 'readonly number[]',
                provenance: 'param',
                value: [10, 20, 30],
              },
              index: {
                kind: 'node',
                instance: lengthInstance,
                holes: {
                  receiver: {
                    kind: 'leaf',
                    owner: 'array-length',
                    hole: 'receiver',
                    type: 'readonly number[]',
                    provenance: 'param',
                    value: [10, 20, 30],
                  },
                },
              },
            },
          },
        }),
      ),
    );

    expect(results).toStrictEqual([
      {
        text: 'receiver.at(arrayLengthReceiver.length)',
        params: [
          { name: 'receiver', type: 'readonly number[]' },
          { name: 'arrayLengthReceiver', type: 'readonly number[]' },
        ],
        declarations: [],
      },
    ]);
  });

  it('VALID: {the tree is one param leaf} => writes its name and takes it as a parameter', () => {
    const result = fillTreeRenderTransformer({
      tree: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'param', value: 3 },
    });

    expect(result).toStrictEqual({ text: 'value', params: [{ name: 'value', type: 'number' }], declarations: [] });
  });

  it('ERROR: {a node with no fill for its hole} => throws and names the node and the hole', () => {
    expect(() =>
      GT_INSTANCES.map((gtInstance) =>
        fillTreeRenderTransformer({
          tree: {
            kind: 'node',
            instance: gtInstance,
            holes: {
              limit: { kind: 'leaf', owner: 'gt', hole: 'limit', type: 'number', provenance: 'literal', value: 5 },
            },
          },
        }),
      ),
    ).toThrow(
      /^The node 'gt-number' has no fill for its hole 'value'\. Give every hole of the node a leaf or a node\.$/u,
    );
  });

  it('ERROR: {a statement node filling a hole} => throws and says a statement never fills a hole', () => {
    expect(() => STATEMENT_IN_HOLE_TREES.map((tree) => fillTreeRenderTransformer({ tree }))).toThrow(
      /^The node 'noop' is a statement, so it cannot fill the hole 'value' of 'gt-number'\. A statement never fills a hole\.$/u,
    );
  });

  it('ERROR: {a random leaf} => throws and says the generator does not write random yet', () => {
    expect(() =>
      fillTreeRenderTransformer({
        tree: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'random', value: 3 },
      }),
    ).toThrow(
      /^The leaf gt\.value has the provenance 'random', which the generator does not write yet\. Remove 'random' from the matrix provenances\.$/u,
    );
  });
});
