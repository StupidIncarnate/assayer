/**
 * PURPOSE: Rewrites a container's `code` body into one specimen's top-level statements. It keeps the
 * top-level block, class member or object member that holds the slot, and drops every one that holds
 * another slot. It writes the rendered parameters where the slot's own callable has `$params`, and
 * removes `$params` from every other callable. It swaps `$R` for the result type, `$Entry` for the
 * entry name, `$exportDefault(x)` for `export default <entry>;`, and the slot marker for the focus. It
 * adds `export` to the entry unless the container exports by default. Reach for this from
 * specimenAssembleTransformer, which then adds the declarations and prints the result.
 *
 * USAGE:
 * rewriteContainerLayerTransformer({ node: container.arrow.body, container, slot, params, resultType, entryName, focusStatements, focusExpression });
 * // Returns the container body with the slot filled in
 */
import ts from '#gateway/npm/typescript';

import type { ContainerSlot } from '../../contracts/container-slot/container-slot-contract';
import type { LoadedContainer } from '../../contracts/loaded-container/loaded-container-contract';
import { parseTypeLayerTransformer } from './parse-type-layer-transformer';

export const rewriteContainerLayerTransformer = ({
  node,
  container,
  slot,
  params,
  resultType,
  entryName,
  focusStatements,
  focusExpression,
}: {
  node: ts.Node;
  container: LoadedContainer;
  slot: ContainerSlot;
  params: readonly { name: string; type: string }[];
  resultType: string;
  entryName: string;
  focusStatements: readonly ts.Statement[];
  focusExpression?: ts.Expression | undefined;
}): ts.VisitResult<ts.Node | undefined> => {
  const topLevel = node.parent === container.arrow.body;
  const holdsOther =
    container.markers.some(
      (marker) => marker !== slot.marker && marker.pos >= node.pos && marker.end <= node.end,
    ) &&
    !(slot.marker.pos >= node.pos && slot.marker.end <= node.end);

  if ((topLevel || ts.isClassElement(node) || ts.isObjectLiteralElementLike(node)) && holdsOther) {
    return undefined;
  }
  if (ts.isParameter(node) && ts.isIdentifier(node.name) && node.name.text === '$params') {
    return node.parent === slot.callable
      ? params.map((param) =>
          ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            param.name,
            undefined,
            parseTypeLayerTransformer({ text: param.type }),
          ),
        )
      : undefined;
  }
  if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && node.typeName.text === '$R') {
    return parseTypeLayerTransformer({ text: resultType });
  }
  if (ts.isIdentifier(node) && node.text === '$Entry') {
    return ts.factory.createIdentifier(entryName);
  }
  if (
    ts.isExpressionStatement(node) &&
    ts.isCallExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === '$exportDefault'
  ) {
    return ts.factory.createExportAssignment(undefined, false, ts.factory.createIdentifier(entryName));
  }
  if (
    slot.kind === 'statement' &&
    (ts.isExpressionStatement(node) || ts.isReturnStatement(node)) &&
    node.expression === slot.marker
  ) {
    return [...focusStatements];
  }
  if (node === slot.marker) {
    if (focusExpression === undefined) {
      throw new Error(
        `The slot '${slot.name}' of the container '${container.name}' is a statement slot, but its marker is used as an expression. Write the marker as its own statement, $stmts('${slot.name}');, or as the value of a return.`,
      );
    }
    return focusExpression;
  }

  const visited = ts.visitEachChild(
    node,
    (child) =>
      rewriteContainerLayerTransformer({
        node: child,
        container,
        slot,
        params,
        resultType,
        entryName,
        focusStatements,
        focusExpression,
      }),
    undefined,
  );
  if (topLevel && ts.isBlock(visited)) {
    return visited.statements;
  }

  const declaresEntry =
    ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)
      ? node.name?.text === '$Entry'
      : ts.isVariableStatement(node) &&
        node.declarationList.declarations.some(
          (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === '$Entry',
        );
  if (container.exportsDefault || !declaresEntry || !(topLevel || ts.isBlock(node.parent))) {
    return visited;
  }

  const exportKeyword = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword);
  if (ts.isFunctionDeclaration(visited)) {
    return ts.factory.updateFunctionDeclaration(
      visited,
      [exportKeyword, ...(ts.getModifiers(visited) ?? [])],
      visited.asteriskToken,
      visited.name,
      visited.typeParameters,
      visited.parameters,
      visited.type,
      visited.body,
    );
  }
  if (ts.isClassDeclaration(visited)) {
    return ts.factory.updateClassDeclaration(
      visited,
      [exportKeyword, ...(ts.getModifiers(visited) ?? [])],
      visited.name,
      visited.typeParameters,
      visited.heritageClauses,
      visited.members,
    );
  }
  if (ts.isVariableStatement(visited)) {
    return ts.factory.updateVariableStatement(
      visited,
      [exportKeyword, ...(ts.getModifiers(visited) ?? [])],
      visited.declarationList,
    );
  }

  return visited;
};
