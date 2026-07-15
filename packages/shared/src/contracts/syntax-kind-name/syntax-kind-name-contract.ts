/**
 * PURPOSE: Contract for a syntax kind name — the AST node KIND a walk dispatched on, as a
 *   serializable string (`'IfStatement'`, `'ForStatement'`, `'MethodDeclaration'`). It is the
 *   parser's own structural vocabulary, never source text, so it carries no formatting and is
 *   safe in identity and in the cache. Keeping it a string rather than a ts-morph enum is what
 *   lets every layer downstream of the walk reason about node kinds without importing ts-morph.
 *
 * USAGE:
 * syntaxKindNameContract.parse('IfStatement');
 * // Returns a validated SyntaxKindName (branded)
 */
import { z } from 'zod';

export const syntaxKindNameContract = z.string().min(1).brand<'SyntaxKindName'>();

export type SyntaxKindName = z.infer<typeof syntaxKindNameContract>;
