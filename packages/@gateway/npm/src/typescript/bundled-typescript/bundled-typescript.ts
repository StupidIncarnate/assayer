/**
 * PURPOSE: The one TypeScript compiler Assayer runs on: the copy `ts-morph` bundles, reached as
 * `require('ts-morph').ts`. The walk, module resolution, the tsconfig read and harness loading all
 * use this object, so the TypeScript version is fixed by Assayer's own `ts-morph` and never by the
 * consumer's installed `typescript`.
 *
 * `ts-morph` exports the compiler as one namespace object, and a namespace has no module to
 * `export ... from`. This file lifts each member a caller uses into its own named export. That is
 * also what lets a proxy stage one function, such as `resolveModuleName`, without replacing the rest
 * of the compiler. A caller that reaches for a member missing here fails typecheck (TS2305). Add the
 * name to the matching list below.
 *
 * USAGE:
 * import { resolveModuleName, sys } from '../bundled-typescript/bundled-typescript';
 * resolveModuleName('./a', '/repo/src/b.ts', {}, sys);
 * // Returns the same answer `require('ts-morph').ts.resolveModuleName` gives
 */
import { ts } from 'ts-morph';

export const {
  EmitHint,
  ModuleKind,
  ModuleResolutionKind,
  ScriptKind,
  ScriptTarget,
  SyntaxKind,
  TypeFlags,
  addSyntheticLeadingComment,
  canHaveModifiers,
  createCompilerHost,
  createPrinter,
  createProgram,
  createSourceFile,
  factory,
  findConfigFile,
  flattenDiagnosticMessageText,
  forEachChild,
  getImpliedNodeFormatForFile,
  getModifiers,
  getParsedCommandLineOfConfigFile,
  isArrayLiteralExpression,
  isArrowFunction,
  isAwaitExpression,
  isBinaryExpression,
  isBindingElement,
  isBlock,
  isCallExpression,
  isClassDeclaration,
  isConditionalExpression,
  isDoStatement,
  isElementAccessExpression,
  isEnumDeclaration,
  isExportAssignment,
  isExportDeclaration,
  isExpression,
  isExpressionStatement,
  isForInStatement,
  isForOfStatement,
  isForStatement,
  isFunctionDeclaration,
  isFunctionExpression,
  isFunctionTypeNode,
  isIdentifier,
  isIfStatement,
  isImportDeclaration,
  isInterfaceDeclaration,
  isIntersectionTypeNode,
  isMethodSignature,
  isNamedExports,
  isNamedImports,
  isNamespaceExport,
  isNamespaceImport,
  isNewExpression,
  isNonNullExpression,
  isNumericLiteral,
  isObjectLiteralExpression,
  isParameter,
  isParenthesizedExpression,
  isParenthesizedTypeNode,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isPropertySignature,
  isQualifiedName,
  isRegularExpressionLiteral,
  isReturnStatement,
  isShorthandPropertyAssignment,
  isSourceFile,
  isSpreadAssignment,
  isStatement,
  isStringLiteral,
  isSwitchStatement,
  isTryStatement,
  isTypeAliasDeclaration,
  isTypeLiteralNode,
  isTypeNode,
  isTypeParameterDeclaration,
  isTypeQueryNode,
  isTypeReferenceNode,
  isVariableDeclaration,
  isVariableStatement,
  isWhileStatement,
  parseConfigFileTextToJson,
  parseJsonConfigFileContent,
  parseJsonText,
  readConfigFile,
  readJsonConfigFile,
  resolveModuleName,
  resolveProjectReferencePath,
  sys,
  transform,
  transpileModule,
  visitEachChild,
} = ts;

export type BindingName = ts.BindingName;
export type CompilerOptions = ts.CompilerOptions;
export type ConciseBody = ts.ConciseBody;
export type Diagnostic = ts.Diagnostic;
export type ExportDeclaration = ts.ExportDeclaration;
export type Expression = ts.Expression;
export type Identifier = ts.Identifier;
export type ImportDeclaration = ts.ImportDeclaration;
export type InterfaceDeclaration = ts.InterfaceDeclaration;
export type MemberName = ts.MemberName;
export type Node = ts.Node;
export type NodeFactory = ts.NodeFactory;
export type ObjectLiteralElementLike = ts.ObjectLiteralElementLike;
export type ParameterDeclaration = ts.ParameterDeclaration;
export type ParsedCommandLine = ts.ParsedCommandLine;
export type ParseConfigFileHost = ts.ParseConfigFileHost;
export type Program = ts.Program;
export type PropertyName = ts.PropertyName;
export type ResolvedModuleWithFailedLookupLocations = ts.ResolvedModuleWithFailedLookupLocations;
export type SourceFile = ts.SourceFile;
export type Statement = ts.Statement;
export type TransformationContext = ts.TransformationContext;
export type Type = ts.Type;
export type TypeAliasDeclaration = ts.TypeAliasDeclaration;
export type TypeReference = ts.TypeReference;
export type VariableStatement = ts.VariableStatement;
