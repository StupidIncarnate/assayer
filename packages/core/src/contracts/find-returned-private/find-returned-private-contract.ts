/**
 * PURPOSE: Defines the data `findReturnedPrivateTransformer` returns
 *
 * USAGE:
 * findReturnedPrivateContract.parse(value);
 * // Returns validated FindReturnedPrivate
 */
import { z } from "#gateway/npm/zod";
import { scopeRecordContract } from "../scope-record/scope-record-contract";
import { callSiteContract } from "../call-site/call-site-contract";

export const findReturnedPrivateContract = z
  .object({ privateScope: scopeRecordContract, call: callSiteContract })
  .brand<"FindReturnedPrivate">();

export type FindReturnedPrivate = z.infer<typeof findReturnedPrivateContract>;
