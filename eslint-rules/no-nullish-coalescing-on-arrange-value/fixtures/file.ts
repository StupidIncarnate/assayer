// Placeholder backing file for typed RuleTester cases. Its on-disk content is never read for
// linting — @typescript-eslint/parser substitutes each test case's own `code` string when it builds
// the program for this path. The file only needs to exist and be covered by ./tsconfig.json's
// `include`, so the type-aware parser has a real project to resolve against.
export {};
