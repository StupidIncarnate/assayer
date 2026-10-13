# <Topic>: the shape slice <id> settled

<!-- A slice lead writes this when its slice settles a shape other slices consume: a contract's members, a proxy's
methods, a harness, a route body. Hold only that shape. Name every export exactly as it is in the code. Delete these
comments once filled in. -->

| Written by | Read by |
|---|---|
| slice <id>, commit <sha> | slices <ids> |

## Exports

| Export | File | Signature |
|---|---|---|
| `<name>` | `<path>` | `<full signature>` |

## Results and errors

<!-- Each result member or error a consumer must handle, and what it means. -->

| Member or error | Meaning |
|---|---|

## How to use it in a test

<!-- The proxy methods, stubs or harness calls a consumer's test uses, with their exact names. -->

## What a consumer must not do

<!-- Mistakes this shape invites, one line each. -->

## For a spike slice

<!-- Only when this file records a spike's answer. -->

- **Answer:** <the hookup, in one paragraph>
- **Evidence:** `<path>:<symbol>`, and what was run to prove it
- **Patterns settled:** <what later slices copy>
