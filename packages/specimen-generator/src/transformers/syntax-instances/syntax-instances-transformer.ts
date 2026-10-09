/**
 * PURPOSE: Expands loaded syntaxes into the instances the planner fills holes with: one per type
 * argument the syntax allows, or one plain instance when it is not generic. Reach for this over
 * syntaxShapeTransformer once the matrix has chosen its type arguments, because each instance has the
 * type parameter replaced in its holes and return type, and has its anchors resolved to that type.
 *
 * USAGE:
 * syntaxInstancesTransformer({ syntaxes: [gtLoaded] });
 * // Returns [{ label: 'gt-number', ... }] when gt allows only number
 */
import type { LoadedSyntax } from '../../contracts/loaded-syntax/loaded-syntax-contract';
import type { SyntaxInstance } from '../../contracts/syntax-instance/syntax-instance-contract';
import { DeclarationError } from '../../errors/declaration/declaration-error';

export const syntaxInstancesTransformer = ({ syntaxes }: { syntaxes: readonly LoadedSyntax[] }): SyntaxInstance[] =>
  syntaxes
    .flatMap((syntax): SyntaxInstance[] => {
      const { typeParameter } = syntax;
      if (typeParameter === undefined) {
        return [
          {
            syntax,
            label: syntax.name,
            holes: syntax.holes,
            anchors: syntax.anchors,
            returnType: syntax.returnType,
          },
        ];
      }

      return syntax.allowedTypeArguments.map((typeArgument): SyntaxInstance => {
        const mentions = new RegExp(`\\b${typeParameter}\\b`, 'u');
        const substitute = new RegExp(`\\b${typeParameter}\\b`, 'gu');
        const anchors = Object.fromEntries(
          Object.entries(syntax.anchors).map(([holeName, value]): [string, unknown] => {
            const isGeneric = syntax.holes.some((hole) => hole.name === holeName && mentions.test(hole.type));
            if (!isGeneric) {
              return [holeName, value];
            }
            const byTypeArgument = new Map<string, unknown>(
              typeof value === 'object' && value !== null && !Array.isArray(value) ? Object.entries(value) : [],
            );
            if (!byTypeArgument.has(typeArgument)) {
              throw new DeclarationError({
                file: syntax.sourceFile.fileName,
                message: `hole '${holeName}' has type ${typeParameter}, so its anchor must give a value for each type argument. It has none for ${typeArgument}. Add ${typeArgument}: <value> to the anchor of '${holeName}'.`,
              });
            }

            return [holeName, byTypeArgument.get(typeArgument)];
          }),
        );

        return {
          syntax,
          typeArgument,
          label: `${syntax.name}-${typeArgument}`,
          holes: syntax.holes.map((hole) => ({ ...hole, type: hole.type.replace(substitute, typeArgument) })),
          anchors,
          returnType: syntax.returnType.replace(substitute, typeArgument),
        };
      });
    })
    .sort((left, right) => Number(left.label > right.label) - Number(left.label < right.label));
