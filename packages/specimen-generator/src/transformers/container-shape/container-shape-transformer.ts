/**
 * PURPOSE: Reads one container declaration into a LoadedContainer: the `code` arrow, every
 * `$stmts` and `$expr` marker in it, and one slot per declared slot with the callable around its
 * marker. It refuses a declaration whose markers and declared slots disagree, and names the slot
 * and the fix. Reach for this when loading a `*.container.ts` file. A syntax or shim declaration
 * has no slots, so it uses syntaxShapeTransformer instead.
 *
 * USAGE:
 * containerShapeTransformer({ sourceFile, declared: moduleContainerExport, name: 'module' });
 * // Returns a LoadedContainer whose slots are sorted by name
 */
import ts from '#gateway/npm/typescript';
import { z } from '#gateway/npm/zod';

import type { ContainerSlot } from '../../contracts/container-slot/container-slot-contract';
import type { LoadedContainer } from '../../contracts/loaded-container/loaded-container-contract';
import { DeclarationError } from '../../errors/declaration/declaration-error';
import { collectNodesLayerTransformer } from './collect-nodes-layer-transformer';
import { nearestCallableLayerTransformer } from './nearest-callable-layer-transformer';
import { readMarkerSlotLayerTransformer } from './read-marker-slot-layer-transformer';

export const containerShapeTransformer = ({
  sourceFile,
  declared,
  name,
}: {
  sourceFile: ts.SourceFile;
  declared: unknown;
  name: string;
}): LoadedContainer => {
  const file = sourceFile.fileName;

  const parsed = z
    .object({
      description: z.string(),
      slots: z.record(z.string(), z.object({ reach: z.string(), arm: z.enum(['log', 'return', 'yield']).optional() })),
    })
    .safeParse(declared);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new DeclarationError({
      file,
      message: `the exported container must be an object with a description string and a slots object, where each slot has a reach string and an optional arm of 'log', 'return' or 'yield'. Problems: ${problems}`,
    });
  }
  const { description, slots: declaredSlots } = parsed.data;

  const [codeProperty] = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isPropertyAssignment }).filter(
    (property) => ts.isIdentifier(property.name) && property.name.text === 'code',
  );
  const arrow = codeProperty?.initializer;
  if (arrow === undefined || !ts.isArrowFunction(arrow)) {
    throw new DeclarationError({
      file,
      message: "has no `code` property holding an arrow function. Write the container as container({ description, slots, code: () => { ... } }).",
    });
  }

  const calls = collectNodesLayerTransformer({ node: arrow, matches: ts.isCallExpression });
  const markers = calls.filter(
    (call) =>
      readMarkerSlotLayerTransformer({ call, markerName: '$stmts' }) !== undefined ||
      readMarkerSlotLayerTransformer({ call, markerName: '$expr' }) !== undefined,
  );

  const slots = Object.entries(declaredSlots)
    .sort(([left], [right]) => {
      if (left < right) {
        return -1;
      }
      return left > right ? 1 : 0;
    })
    .map(([slotName, declaredSlot]): ContainerSlot => {
      const statementMarkers = calls.filter(
        (call) => readMarkerSlotLayerTransformer({ call, markerName: '$stmts' }) === slotName,
      );
      const expressionMarkers = calls.filter(
        (call) => readMarkerSlotLayerTransformer({ call, markerName: '$expr' }) === slotName,
      );
      const found = [...statementMarkers, ...expressionMarkers];
      const [marker] = found;
      if (marker === undefined || found.length !== 1) {
        throw new DeclarationError({
          file,
          message: `slot '${slotName}' must appear exactly once in code, as $stmts('${slotName}') or $expr('${slotName}'). It appears ${found.length} times. Add or remove markers until it appears once, or remove '${slotName}' from slots.`,
        });
      }

      const kind = statementMarkers.length === 1 ? 'statement' : 'expression';
      if (kind === 'statement' && declaredSlot.arm === undefined) {
        throw new DeclarationError({
          file,
          message: `slot '${slotName}' is a statement slot, so it needs an arm of 'log', 'return' or 'yield'. Add arm to slots['${slotName}'], or change the marker to $expr('${slotName}').`,
        });
      }
      if (kind === 'expression' && declaredSlot.arm !== undefined) {
        throw new DeclarationError({
          file,
          message: `slot '${slotName}' is an expression slot, so it takes no arm. Remove arm from slots['${slotName}'], or change the marker to $stmts('${slotName}').`,
        });
      }

      const callable = nearestCallableLayerTransformer({ node: marker, stop: arrow });
      return {
        name: slotName,
        kind,
        reach: declaredSlot.reach,
        ...(declaredSlot.arm === undefined ? {} : { arm: declaredSlot.arm }),
        marker,
        ...(callable === undefined ? {} : { callable }),
        hasParams:
          callable?.parameters.some((parameter) => ts.isIdentifier(parameter.name) && parameter.name.text === '$params') ??
          false,
      };
    });

  for (const markerName of ['$stmts', '$expr']) {
    for (const call of calls) {
      const slotName = readMarkerSlotLayerTransformer({ call, markerName });
      if (slotName !== undefined && !Object.keys(declaredSlots).includes(slotName)) {
        throw new DeclarationError({
          file,
          message: `code has ${markerName}('${slotName}'), but slots does not declare '${slotName}'. Add '${slotName}' to slots, or remove the marker.`,
        });
      }
    }
  }

  return {
    name,
    description,
    arrow,
    sourceFile,
    slots,
    markers,
    isClass: collectNodesLayerTransformer({ node: arrow, matches: ts.isClassDeclaration }).some(
      (declaration) => declaration.name?.text === '$Entry',
    ),
    exportsDefault: calls.some((call) => ts.isIdentifier(call.expression) && call.expression.text === '$exportDefault'),
  };
};
