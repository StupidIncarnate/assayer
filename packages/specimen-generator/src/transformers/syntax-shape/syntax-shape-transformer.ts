/**
 * PURPOSE: Turns one syntax or shim declaration into a LoadedSyntax. It pairs the object the file
 * exports with what the type checker says about the file's `code` arrow function: its holes, return
 * type, arms and type parameter. Reach for this over syntaxInstancesTransformer when a declaration
 * has not yet been bound to a type argument. It refuses a malformed declaration with an error that
 * names the file and the fix.
 *
 * USAGE:
 * syntaxShapeTransformer({ sourceFile, checker, declared: gtSyntax, origin: 'syntax', typeArguments: ['number'] });
 * // Returns a LoadedSyntax named 'gt' with kind 'expression' and allowedTypeArguments ['number']
 */
import ts from '#gateway/npm/typescript';

import type { LoadedSyntax } from '../../contracts/loaded-syntax/loaded-syntax-contract';
import { DeclarationError } from '../../errors/declaration/declaration-error';
import { generatorLayoutStatics } from '../../statics/generator-layout/generator-layout-statics';
import { collectNodesTransformer } from '../collect-nodes/collect-nodes-transformer';
import { readDeclaredLayerTransformer } from './read-declared-layer-transformer';

export const syntaxShapeTransformer = ({
  sourceFile,
  checker,
  declared,
  origin,
  typeArguments,
}: {
  sourceFile: ts.SourceFile;
  checker: ts.TypeChecker;
  declared: unknown;
  origin: 'shim' | 'syntax';
  typeArguments: readonly string[];
}): LoadedSyntax => {
  const file = sourceFile.fileName;
  const suffix =
    origin === 'shim'
      ? generatorLayoutStatics.declarations.shims.suffix
      : generatorLayoutStatics.declarations.syntax.suffix;
  const name = file.slice(file.lastIndexOf('/') + 1).replace(suffix, '');
  const fromDeclared = readDeclaredLayerTransformer({ declared, file, origin });

  const [codeProperty] = collectNodesTransformer({
    node: sourceFile,
    matches: (node): node is ts.PropertyAssignment =>
      ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === 'code',
  });
  const arrow = codeProperty?.initializer;
  if (arrow === undefined || !ts.isArrowFunction(arrow)) {
    throw new DeclarationError({
      file,
      message: 'has no `code` property that holds an arrow function. Write the declaration code as an arrow function.',
    });
  }
  const signature = checker.getSignatureFromDeclaration(arrow);
  if (signature === undefined) {
    throw new DeclarationError({
      file,
      message: 'the type checker could not read the signature of `code`. Fix the type errors in the file.',
    });
  }
  if (!arrow.parameters.every((parameter) => ts.isIdentifier(parameter.name))) {
    throw new DeclarationError({
      file,
      message: 'every parameter of `code` is a hole, so each one must be a plain name. Replace the destructured parameter.',
    });
  }

  const holes = signature.parameters.map((symbol) => ({
    name: symbol.name,
    type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, arrow)),
    symbol,
  }));
  const returnType = checker.typeToString(checker.getReturnTypeOfSignature(signature));
  const arms = collectNodesTransformer({
    node: arrow.body,
    matches: (node): node is ts.CallExpression =>
      ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === '$arm',
  }).map((call) => {
    const [first] = call.arguments;
    if (first === undefined || !ts.isStringLiteral(first)) {
      throw new DeclarationError({
        file,
        message: "every $arm call needs a string literal name. Write $arm('then'), for example.",
      });
    }
    return first.text;
  });

  const holeNames = holes.map((hole) => hole.name);
  const unknownAnchor = Object.keys(fromDeclared.anchors).find((anchor) => !holeNames.includes(anchor));
  if (unknownAnchor !== undefined) {
    throw new DeclarationError({
      file,
      message: `anchors names '${unknownAnchor}', which is not a hole. Name only parameters of code in anchors, or add the parameter to code.`,
    });
  }

  const isShim = origin === 'shim';
  const { form, range } = fromDeclared;
  if (form !== undefined && form.kind !== 'call' && holes.length === 0) {
    throw new DeclarationError({
      file,
      message: `a ${form.kind} shim's first parameter is the receiver, so code needs at least one parameter. Add the receiver as the first parameter of code.`,
    });
  }
  if (form?.kind === 'getter' && holes.length !== 1) {
    throw new DeclarationError({
      file,
      message:
        'a getter shim takes only the receiver, so code needs exactly one parameter. Remove the other parameters.',
    });
  }
  if (range !== undefined && holes.length > 0) {
    throw new DeclarationError({
      file,
      message:
        'a shim with inputs computes its result from them, so it declares no range. Remove the range, or remove the inputs.',
    });
  }

  const typeParameterCount = arrow.typeParameters?.length ?? 0;
  if (typeParameterCount > 1) {
    throw new DeclarationError({
      file,
      message: `code has ${typeParameterCount} type parameters, and at most one is supported. Keep one type parameter.`,
    });
  }
  const typeParameter = arrow.typeParameters?.[0];
  const constraint =
    typeParameter?.constraint === undefined
      ? undefined
      : checker.typeToString(checker.getTypeAtLocation(typeParameter.constraint));
  const allowedTypeArguments =
    typeParameter === undefined
      ? []
      : typeArguments.filter((typeArgument) => constraint === undefined || constraint.split(' | ').includes(typeArgument));
  if (typeParameter !== undefined && allowedTypeArguments.length === 0) {
    throw new DeclarationError({
      file,
      message: `no type argument satisfies ${typeParameter.name.text} extends ${constraint ?? 'unknown'}. Loosen the constraint, or add a matching type to the matrix type arguments.`,
    });
  }

  const isStatement = !isShim && ts.isBlock(arrow.body);
  if (
    isStatement &&
    collectNodesTransformer({ node: arrow.body, matches: ts.isReturnStatement }).length > 0
  ) {
    throw new DeclarationError({
      file,
      message:
        'its code has a block body, which makes it a statement, but the block returns a value. Write an expression as an expression body, such as (a: number): boolean => a > 5.',
    });
  }
  if (isStatement && returnType !== 'void') {
    throw new DeclarationError({
      file,
      message: `its code is a statement, so it must return void, not ${returnType}. Declare the return type as void.`,
    });
  }

  return {
    ...fromDeclared,
    name,
    origin,
    kind: isStatement ? 'statement' : 'expression',
    holes,
    returnType,
    ...(typeParameter === undefined ? {} : { typeParameter: typeParameter.name.text }),
    allowedTypeArguments,
    arms,
    arrow,
    sourceFile,
  };
};
