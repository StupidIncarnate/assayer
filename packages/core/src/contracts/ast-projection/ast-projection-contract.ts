/**
 * PURPOSE: Contract for an AST projection — a normalized, structure-only token derived from PARSED
 *   syntax: a node's KIND, an identifier's SYMBOL name (`id:name`), or a literal's VALUE (`str:get`,
 *   `num:0`) — and, comma-joined, the token stream of a whole condition or discriminant. This is the
 *   coverage-identity grammar: it moves only when the logic moves, never when the spelling does
 *   (quote style, operator spacing, reindent, and redundant parens all erase).
 *
 * USAGE:
 * astProjectionContract.parse('BinaryExpression,id:name,EqualsEqualsEqualsToken,str:blah');
 * // Returns a validated AstProjection (branded)
 */
import { z } from 'zod';

export const astProjectionContract = z.string().min(1).brand<'AstProjection'>();

export type AstProjection = z.infer<typeof astProjectionContract>;
