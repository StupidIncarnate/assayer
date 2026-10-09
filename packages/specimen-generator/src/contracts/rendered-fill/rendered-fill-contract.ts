/**
 * PURPOSE: The focus code of one specimen, rendered from its fill tree, plus what that code needs
 * around it: the parameters the callable must take and the declarations for the top of the file.
 * Reach for this to pass the renderer's result to the assembler.
 *
 * USAGE:
 * renderedFillContract.parse({ text: "return 'then';", params: [{ name: 'value', type: 'number' }], declarations: [] });
 * // Returns a RenderedFill
 */
import { z } from '#gateway/npm/zod';

export const renderedFillContract = z
  .object({
    text: z.string().brand<'RenderedFillText'>(),
    params: z.array(
      z
        .object({
          name: z.string().min(1).brand<'RenderedFillParamsName'>(),
          type: z.string().min(1).brand<'RenderedFillParamsType'>(),
        })
        .brand<'RenderedFillParams'>(),
    ),
    declarations: z.array(
      z
        .object({
          name: z.string().min(1).brand<'RenderedFillDeclarationsName'>(),
          text: z.string().min(1).brand<'RenderedFillDeclarationsText'>(),
        })
        .brand<'RenderedFillDeclarations'>(),
    ),
  })
  .brand<'RenderedFill'>();

export type RenderedFill = z.infer<typeof renderedFillContract>;
