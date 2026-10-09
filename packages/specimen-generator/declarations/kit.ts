// The markers and helpers a declaration file imports. This file holds types only. It is never run:
// the generator evaluates each declaration in a sandbox whose kit import answers with the generator's
// own run-time versions of these names.
//
//   $stmts('name')        a statement slot named `name`. `return $stmts('name');` is the same slot
//   $expr('name')         an expression slot named `name`
//   $params: never        a parameter list the generator fills with the parameters the focus asks for
//   $R                    a type the generator fills with the focus's result type
//   $Entry                the name of the thing a test reaches. The generator exports it
//   $exportDefault(x)     becomes `export default x;`
//   $arm('name')          one arm of a branching syntax. At run time it throws, and the generator catches
//                         which arm a set of known values reached

export declare const $arm: (name: string) => never;

// Typed `never`, so a callable whose whole body is a statement slot needs no return of its own.
export declare const $stmts: (slot: string) => never;
export declare const $expr: <T = any>(slot: string) => T;
export declare const $exportDefault: (value: unknown) => void;
export type $R = any;

// How a test reaches a slot.
export type Reach =
  | 'call'
  | 'call-and-await'
  | 'call-and-iterate'
  | 'call-static'
  | 'call-member'
  | 'construct'
  | 'construct-then-call'
  | 'construct-then-read'
  | 'module-load';

// What one arm of a branching syntax becomes in a statement slot.
//   return   `return 'then';`        ends the scope
//   log      `console.log('then');`  does not end the scope
//   yield    `yield 'then';`         does not end the scope
export type Arm = 'return' | 'log' | 'yield';

export type SlotDecl = { reach: Reach; arm?: Arm };

export declare const container: (c: { description: string; slots: Record<string, SlotDecl>; code: () => void }) => typeof c;

export declare const syntax: (p: {
  description: string;
  code: (...holes: any[]) => unknown;
  // The literal a hole takes whenever it is not the one leaf that varies.
  anchors?: Record<string, unknown>;
}) => typeof p;

// How the generator writes a call to the builtin a shim stands for.
//   method   writes `receiver.name(arg, ...)`. The shim's first parameter is the receiver
//   getter   writes `receiver.name`. The shim's only parameter is the receiver
//   call     writes `name(arg, ...)`, for a builtin with no receiver, such as `Math.random()`
export type ShimForm = { kind: 'method' | 'getter' | 'call'; name: string };

// The values a builtin's result can take, when no input decides it. A shim whose result its inputs decide,
// such as `.at` or `.length`, declares no range: its code already says what it returns.
export type ShimRange = { min: number; max: number; maxExclusive: boolean; whole: boolean };

// How a test gets a chosen result from a builtin no input decides.
//   'range'           Assayer picks one value in each region the code's checks cut the range into
//   (want) => value   the shim builds a valid value for the outcome Assayer wants, for a builtin whose type
//                     alone cannot produce one, such as a UUID
export type ShimPin = 'range' | ((want: { region: [number, number] }) => unknown);

export declare const shim: (s: {
  description: string;
  // The declaration the shim stands for, as the type checker names it.
  builtin: string;
  form: ShimForm;
  // The builtin's behavior, written from the spec as plain TypeScript.
  code: (...args: any[]) => unknown;
  range?: ShimRange;
  pin?: ShimPin;
  anchors?: Record<string, unknown>;
}) => typeof s;
