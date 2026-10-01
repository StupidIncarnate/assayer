/**
 * PURPOSE: Defines the data `compileStubGraphBroker` returns
 *
 * USAGE:
 * compileStubGraphResultContract.parse(value);
 * // Returns validated CompileStubGraphResult
 */
import { z } from "#gateway/npm/zod";
import { stubIndexContract } from "@assayer/shared/contracts";
import { propertyGuardContract } from "../property-guard/property-guard-contract";

export const compileStubGraphResultContract = z
  .object({ index: stubIndexContract, guards: z.array(propertyGuardContract) })
  .brand<"CompileStubGraphResult">();

export type CompileStubGraphResult = z.infer<
  typeof compileStubGraphResultContract
>;
