/**
 * PURPOSE: Builds a valid TypeofDomain for tests
 *
 * USAGE:
 * TypeofDomainStub();
 * // Returns a valid TypeofDomain
 */
import type { StubArgument } from "@legendscribe/pokayoke/shared/@types";

import { typeofDomainContract } from "./typeof-domain-contract";
import type { TypeofDomain } from "./typeof-domain-contract";

export const TypeofDomainStub = ({
  ...props
}: StubArgument<TypeofDomain> = {}): TypeofDomain =>
  typeofDomainContract.parse({ ...props });
