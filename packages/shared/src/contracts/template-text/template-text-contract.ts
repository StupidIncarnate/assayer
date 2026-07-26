/**
 * PURPOSE: Contract for one literal segment of a template literal type
 *   (`` `id-${string}` ``'s `'id-'` and `''`), carried on a `template` type descriptor between its
 *   substitutions. Unlike `TypeText`, EMPTY is valid: a substitution at the very start or end of the
 *   template (`` `${string}-units` ``) leaves the segment before or after it empty, and that is the
 *   type as declared, not a missing value.
 *
 * USAGE:
 * templateTextContract.parse('id-');
 * templateTextContract.parse('');
 * // Returns a validated TemplateText (branded)
 */
import { z } from 'zod';

export const templateTextContract = z.string().brand<'TemplateText'>();

export type TemplateText = z.infer<typeof templateTextContract>;
