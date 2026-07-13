/**
 * PURPOSE: Collapses insignificant whitespace (spaces, tabs, newlines) in a source-expression string
 *   to single spaces and trims it, so a coverage ID minted from a condition/discriminant/case is
 *   stable across reformatting — a multi-line condition reindented yields the same identity.
 *   (Whitespace inside string literals collapses too; negligible for a cache-internal identity key.)
 *
 * USAGE:
 * normalizeSourceTextTransformer({ text: 'name.length ===\n  0' });
 * // Returns 'name.length === 0' (branded NormalizedSource)
 */
import { normalizedSourceContract } from '../../contracts/normalized-source/normalized-source-contract';
import type { NormalizedSource } from '../../contracts/normalized-source/normalized-source-contract';

export const normalizeSourceTextTransformer = ({ text }: { text: string }): NormalizedSource =>
  normalizedSourceContract.parse(text.replace(/\s+/gu, ' ').trim());
