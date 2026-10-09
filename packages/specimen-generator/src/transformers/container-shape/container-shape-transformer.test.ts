import ts from '#gateway/npm/typescript';

import { containerShapeTransformer } from './container-shape-transformer';

describe('containerShapeTransformer', () => {
  describe('slots', () => {
    it('VALID: {class container with method, constructor, getter and field slots} => returns slots sorted by name with kind, reach, arm, callable and hasParams', () => {
      const sourceFile = ts.createSourceFile(
        'class.container.ts',
        `export const classContainer = container({
  code: () => {
    class $Entry {
      public label = $expr('field');
      public constructor($params: never) {
        $stmts('constructor-body');
      }
      public run($params: never): $R {
        $stmts('method');
      }
      public get result(): $R {
        return $stmts('getter');
      }
    }
  },
});
`,
        ts.ScriptTarget.ES2022,
        true,
      );

      const result = containerShapeTransformer({
        sourceFile,
        declared: {
          description: 'an exported class',
          slots: {
            method: { reach: 'construct-then-call', arm: 'return' },
            getter: { reach: 'construct-then-read', arm: 'return' },
            'constructor-body': { reach: 'construct', arm: 'log' },
            field: { reach: 'construct' },
          },
        },
        name: 'class',
      });

      expect(
        result.slots.map((slot) => ({
          name: slot.name,
          kind: slot.kind,
          reach: slot.reach,
          arm: slot.arm,
          marker: slot.marker.getText(sourceFile),
          callable: slot.callable?.kind,
          hasParams: slot.hasParams,
        })),
      ).toStrictEqual([
        {
          name: 'constructor-body',
          kind: 'statement',
          reach: 'construct',
          arm: 'log',
          marker: "$stmts('constructor-body')",
          callable: ts.SyntaxKind.Constructor,
          hasParams: true,
        },
        {
          name: 'field',
          kind: 'expression',
          reach: 'construct',
          arm: undefined,
          marker: "$expr('field')",
          callable: undefined,
          hasParams: false,
        },
        {
          name: 'getter',
          kind: 'statement',
          reach: 'construct-then-read',
          arm: 'return',
          marker: "$stmts('getter')",
          callable: ts.SyntaxKind.GetAccessor,
          hasParams: false,
        },
        {
          name: 'method',
          kind: 'statement',
          reach: 'construct-then-call',
          arm: 'return',
          marker: "$stmts('method')",
          callable: ts.SyntaxKind.MethodDeclaration,
          hasParams: true,
        },
      ]);
    });

    it('VALID: {module container, markers at the top level} => callable is absent and hasParams is false', () => {
      const sourceFile = ts.createSourceFile(
        'module.container.ts',
        `export const moduleContainer = container({
  code: () => {
    $stmts('statement');
    const $Entry = $expr('exported-const');
  },
});
`,
        ts.ScriptTarget.ES2022,
        true,
      );

      const result = containerShapeTransformer({
        sourceFile,
        declared: {
          description: 'the top level of a module',
          slots: { statement: { reach: 'module-load', arm: 'log' }, 'exported-const': { reach: 'module-load' } },
        },
        name: 'module',
      });

      expect(
        result.slots.map((slot) => ({ name: slot.name, kind: slot.kind, callable: slot.callable, hasParams: slot.hasParams })),
      ).toStrictEqual([
        { name: 'exported-const', kind: 'expression', callable: undefined, hasParams: false },
        { name: 'statement', kind: 'statement', callable: undefined, hasParams: false },
      ]);
    });

    it('VALID: {callable whose parameter is not named $params} => hasParams is false', () => {
      const sourceFile = ts.createSourceFile(
        'function.container.ts',
        `export const functionContainer = container({
  code: () => {
    function $Entry(other: number, { pattern }: never) {
      $stmts('body');
    }
  },
});
`,
        ts.ScriptTarget.ES2022,
        true,
      );

      const result = containerShapeTransformer({
        sourceFile,
        declared: { description: 'a function', slots: { body: { reach: 'call', arm: 'return' } } },
        name: 'function',
      });

      expect(result.slots.map((slot) => ({ callable: slot.callable?.kind, hasParams: slot.hasParams }))).toStrictEqual([
        { callable: ts.SyntaxKind.FunctionDeclaration, hasParams: false },
      ]);
    });

    it('VALID: {markers declared in reverse order} => slots are sorted by name', () => {
      const sourceFile = ts.createSourceFile(
        'two.container.ts',
        `export const twoContainer = container({
  code: () => {
    $stmts('b');
    $stmts('a');
  },
});
`,
        ts.ScriptTarget.ES2022,
        true,
      );

      const result = containerShapeTransformer({
        sourceFile,
        declared: { description: 'two', slots: { b: { reach: 'module-load', arm: 'log' }, a: { reach: 'module-load', arm: 'log' } } },
        name: 'two',
      });

      expect(result.slots.map((slot) => slot.name)).toStrictEqual(['a', 'b']);
    });
  });

  describe('container facts', () => {
    it('VALID: {class named $Entry, no $exportDefault} => isClass is true, exportsDefault is false, and the name, description and markers are returned', () => {
      const sourceFile = ts.createSourceFile(
        'class.container.ts',
        `export const classContainer = container({
  code: () => {
    class $Entry {
      public run($params: never): $R {
        $stmts('method');
      }
    }
  },
});
`,
        ts.ScriptTarget.ES2022,
        true,
      );

      const result = containerShapeTransformer({
        sourceFile,
        declared: { description: 'an exported class', slots: { method: { reach: 'construct-then-call', arm: 'return' } } },
        name: 'class',
      });

      expect({
        name: result.name,
        description: result.description,
        sourceFile: result.sourceFile === sourceFile,
        arrowKind: result.arrow.kind,
        markers: result.markers.map((marker) => marker.getText(sourceFile)),
        isClass: result.isClass,
        exportsDefault: result.exportsDefault,
      }).toStrictEqual({
        name: 'class',
        description: 'an exported class',
        sourceFile: true,
        arrowKind: ts.SyntaxKind.ArrowFunction,
        markers: ["$stmts('method')"],
        isClass: true,
        exportsDefault: false,
      });
    });

    it('VALID: {class named other than $Entry} => isClass is false', () => {
      const sourceFile = ts.createSourceFile(
        'other.container.ts',
        `export const otherContainer = container({
  code: () => {
    class Other {}
    $stmts('body');
  },
});
`,
        ts.ScriptTarget.ES2022,
        true,
      );

      const result = containerShapeTransformer({
        sourceFile,
        declared: { description: 'other', slots: { body: { reach: 'module-load', arm: 'log' } } },
        name: 'other',
      });

      expect(result.isClass).toBe(false);
    });

    it('VALID: {code calls $exportDefault} => exportsDefault is true and isClass is false', () => {
      const sourceFile = ts.createSourceFile(
        'default-export.container.ts',
        `export const defaultExportContainer = container({
  code: () => {
    const $Entry = ($params: never): $R => {
      $stmts('body');
    };
    $exportDefault($Entry);
  },
});
`,
        ts.ScriptTarget.ES2022,
        true,
      );

      const result = containerShapeTransformer({
        sourceFile,
        declared: { description: 'a default export', slots: { body: { reach: 'call', arm: 'return' } } },
        name: 'default-export',
      });

      expect({ isClass: result.isClass, exportsDefault: result.exportsDefault }).toStrictEqual({
        isClass: false,
        exportsDefault: true,
      });
    });

    it('EMPTY: {no slots, no markers} => returns no slots and no markers', () => {
      const sourceFile = ts.createSourceFile(
        'empty.container.ts',
        `export const emptyContainer = container({ code: () => { other(); } });\n`,
        ts.ScriptTarget.ES2022,
        true,
      );

      const result = containerShapeTransformer({ sourceFile, declared: { description: 'empty', slots: {} }, name: 'empty' });

      expect({ slots: result.slots, markers: result.markers }).toStrictEqual({ slots: [], markers: [] });
    });
  });

  describe('refusals', () => {
    it('ERROR: {declared: no description} => throws naming the problem', () => {
      const sourceFile = ts.createSourceFile('bad.container.ts', 'container({ code: () => {} });\n', ts.ScriptTarget.ES2022, true);

      expect(() => {
        return containerShapeTransformer({ sourceFile, declared: { slots: {} }, name: 'bad' });
      }).toThrow(
        /^bad\.container\.ts: the exported container must be an object with a description string and a slots object, where each slot has a reach string and an optional arm of 'log', 'return' or 'yield'\. Problems: description: Invalid input: expected string, received undefined$/u,
      );
    });

    it('ERROR: {no code property} => throws with the fix', () => {
      const sourceFile = ts.createSourceFile('bad.container.ts', 'container({ description: "x" });\n', ts.ScriptTarget.ES2022, true);

      expect(() => {
        return containerShapeTransformer({ sourceFile, declared: { description: 'x', slots: {} }, name: 'bad' });
      }).toThrow(
        /^bad\.container\.ts: has no `code` property holding an arrow function\. Write the container as container\(\{ description, slots, code: \(\) => \{ \.\.\. \} \}\)\.$/u,
      );
    });

    it('ERROR: {code is not an arrow function} => throws with the fix', () => {
      const sourceFile = ts.createSourceFile('bad.container.ts', 'container({ code: 5 });\n', ts.ScriptTarget.ES2022, true);

      expect(() => {
        return containerShapeTransformer({ sourceFile, declared: { description: 'x', slots: {} }, name: 'bad' });
      }).toThrow(
        /^bad\.container\.ts: has no `code` property holding an arrow function\. Write the container as container\(\{ description, slots, code: \(\) => \{ \.\.\. \} \}\)\.$/u,
      );
    });

    it('ERROR: {declared slot never appears in code} => throws naming the slot and its count', () => {
      const sourceFile = ts.createSourceFile('bad.container.ts', 'container({ code: () => { other(); } });\n', ts.ScriptTarget.ES2022, true);

      expect(() => {
        return containerShapeTransformer({
          sourceFile,
          declared: { description: 'x', slots: { body: { reach: 'call', arm: 'return' } } },
          name: 'bad',
        });
      }).toThrow(
        /^bad\.container\.ts: slot 'body' must appear exactly once in code, as \$stmts\('body'\) or \$expr\('body'\)\. It appears 0 times\. Add or remove markers until it appears once, or remove 'body' from slots\.$/u,
      );
    });

    it('ERROR: {declared slot appears twice} => throws naming the slot and its count', () => {
      const sourceFile = ts.createSourceFile(
        'bad.container.ts',
        "container({ code: () => { $stmts('body'); $stmts('body'); } });\n",
        ts.ScriptTarget.ES2022,
        true,
      );

      expect(() => {
        return containerShapeTransformer({
          sourceFile,
          declared: { description: 'x', slots: { body: { reach: 'call', arm: 'return' } } },
          name: 'bad',
        });
      }).toThrow(
        /^bad\.container\.ts: slot 'body' must appear exactly once in code, as \$stmts\('body'\) or \$expr\('body'\)\. It appears 2 times\. Add or remove markers until it appears once, or remove 'body' from slots\.$/u,
      );
    });

    it('ERROR: {declared slot appears as $stmts and as $expr} => throws counting both markers', () => {
      const sourceFile = ts.createSourceFile(
        'bad.container.ts',
        "container({ code: () => { $stmts('body'); $expr('body'); } });\n",
        ts.ScriptTarget.ES2022,
        true,
      );

      expect(() => {
        return containerShapeTransformer({
          sourceFile,
          declared: { description: 'x', slots: { body: { reach: 'call', arm: 'return' } } },
          name: 'bad',
        });
      }).toThrow(/^bad\.container\.ts: slot 'body' must appear exactly once in code, .* It appears 2 times\./u);
    });

    it('ERROR: {statement slot without arm} => throws asking for an arm', () => {
      const sourceFile = ts.createSourceFile('bad.container.ts', "container({ code: () => { $stmts('body'); } });\n", ts.ScriptTarget.ES2022, true);

      expect(() => {
        return containerShapeTransformer({ sourceFile, declared: { description: 'x', slots: { body: { reach: 'call' } } }, name: 'bad' });
      }).toThrow(
        /^bad\.container\.ts: slot 'body' is a statement slot, so it needs an arm of 'log', 'return' or 'yield'\. Add arm to slots\['body'\], or change the marker to \$expr\('body'\)\.$/u,
      );
    });

    it('ERROR: {expression slot with arm} => throws refusing the arm', () => {
      const sourceFile = ts.createSourceFile('bad.container.ts', "container({ code: () => { const x = $expr('field'); } });\n", ts.ScriptTarget.ES2022, true);

      expect(() => {
        return containerShapeTransformer({
          sourceFile,
          declared: { description: 'x', slots: { field: { reach: 'call', arm: 'log' } } },
          name: 'bad',
        });
      }).toThrow(
        /^bad\.container\.ts: slot 'field' is an expression slot, so it takes no arm\. Remove arm from slots\['field'\], or change the marker to \$stmts\('field'\)\.$/u,
      );
    });

    it('ERROR: {$stmts marker names an undeclared slot} => throws naming the marker and the slot', () => {
      const sourceFile = ts.createSourceFile('bad.container.ts', "container({ code: () => { $stmts('extra'); } });\n", ts.ScriptTarget.ES2022, true);

      expect(() => {
        return containerShapeTransformer({ sourceFile, declared: { description: 'x', slots: {} }, name: 'bad' });
      }).toThrow(
        /^bad\.container\.ts: code has \$stmts\('extra'\), but slots does not declare 'extra'\. Add 'extra' to slots, or remove the marker\.$/u,
      );
    });

    it('ERROR: {$expr marker names an undeclared slot} => throws naming the marker and the slot', () => {
      const sourceFile = ts.createSourceFile('bad.container.ts', "container({ code: () => { const x = $expr('extra'); } });\n", ts.ScriptTarget.ES2022, true);

      expect(() => {
        return containerShapeTransformer({ sourceFile, declared: { description: 'x', slots: {} }, name: 'bad' });
      }).toThrow(
        /^bad\.container\.ts: code has \$expr\('extra'\), but slots does not declare 'extra'\. Add 'extra' to slots, or remove the marker\.$/u,
      );
    });
  });
});
