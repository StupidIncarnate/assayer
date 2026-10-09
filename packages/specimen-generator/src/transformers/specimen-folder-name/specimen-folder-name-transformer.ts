/**
 * PURPOSE: Names a specimen's folder and the entry it exports. The folder joins the focus label, the
 * container, the slot (only when the container has more than one), the path to the varying leaf and
 * its provenance, all in kebab case. The entry name is that folder name in PascalCase for a class and
 * camelCase for anything else. Reach for this wherever a specimen's name is needed, so every file
 * agrees on it.
 *
 * USAGE:
 * specimenFolderNameTransformer({ focusLabel: 'if-number', containerName: 'function-declaration', slotName: 'body', multiSlot: false, path: ['cond'], provenance: 'param', isClass: false });
 * // Returns { folder: 'if-number-function-declaration-cond-param', entryName: 'ifNumberFunctionDeclarationCondParam' }
 */
import type { Provenance } from '../../contracts/provenance/provenance-contract';

export const specimenFolderNameTransformer = ({
  focusLabel,
  containerName,
  slotName,
  multiSlot,
  path,
  provenance,
  isClass,
}: {
  focusLabel: string;
  containerName: string;
  slotName: string;
  multiSlot: boolean;
  path: readonly string[];
  provenance: Provenance;
  isClass: boolean;
}): { folder: string; entryName: string } => {
  const folder = [
    focusLabel,
    containerName,
    ...(multiSlot ? [slotName] : []),
    ...path.map((part) => part.replace(/([a-z0-9])([A-Z])/gu, '$1-$2').toLowerCase()),
    provenance,
  ].join('-');
  const camel = folder.replace(/-([a-z0-9])/gu, (_match, letter: string) => letter.toUpperCase());

  return {
    folder,
    entryName: isClass ? `${camel.charAt(0).toUpperCase()}${camel.slice(1)}` : camel,
  };
};
