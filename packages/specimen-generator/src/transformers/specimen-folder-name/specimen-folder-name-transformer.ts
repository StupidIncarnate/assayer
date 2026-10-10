/**
 * PURPOSE: Names a specimen's folder and the entry it exports, with parent folders (syntax name,
 * container name, verdict) removed. The folder joins the type argument (when generic), the slot
 * (only when the container has more than one), the path to the varying leaf and its provenance, all
 * in kebab case. The entry name is that folder name in PascalCase for a class and camelCase for
 * anything else. Reach for this wherever a specimen's name is needed, so every file agrees on it.
 *
 * USAGE:
 * specimenFolderNameTransformer({ typeArgument: 'number', slotName: 'body', multiSlot: false, path: ['cond'], provenance: 'param', isClass: false });
 * // Returns { folder: 'number-cond-param', entryName: 'numberCondParam' }
 */
import type { Provenance } from '../../contracts/provenance/provenance-contract';

export const specimenFolderNameTransformer = ({
  typeArgument,
  focusLabel,
  syntaxName,
  slotName,
  multiSlot,
  path,
  provenance,
  isClass,
}: {
  typeArgument?: string | undefined;
  focusLabel?: string | undefined;
  syntaxName?: string | undefined;
  slotName: string;
  multiSlot: boolean;
  path: readonly string[];
  provenance: Provenance;
  isClass: boolean;
}): { folder: string; entryName: string } => {
  let resolvedType = typeArgument;
  if (resolvedType === undefined && focusLabel !== undefined) {
    if (syntaxName === undefined) {
      const dash = focusLabel.indexOf('-');
      resolvedType = dash >= 0 ? focusLabel.slice(dash + 1) : undefined;
    } else {
      resolvedType = focusLabel.startsWith(`${syntaxName}-`)
        ? focusLabel.slice(syntaxName.length + 1)
        : focusLabel === syntaxName
          ? undefined
          : focusLabel;
    }
  }

  const parts = [
    ...(resolvedType !== undefined && resolvedType !== '' ? [resolvedType] : []),
    ...(multiSlot ? [slotName.replace(/([a-z0-9])([A-Z])/gu, '$1-$2').toLowerCase()] : []),
    ...path.map((part) => part.replace(/([a-z0-9])([A-Z])/gu, '$1-$2').toLowerCase()),
    provenance,
  ];
  const folder = parts.join('-');
  const camel = folder.replace(/-([a-z0-9])/gu, (_match, letter: string) => letter.toUpperCase());

  return {
    folder,
    entryName: isClass ? `${camel.charAt(0).toUpperCase()}${camel.slice(1)}` : camel,
  };
};
