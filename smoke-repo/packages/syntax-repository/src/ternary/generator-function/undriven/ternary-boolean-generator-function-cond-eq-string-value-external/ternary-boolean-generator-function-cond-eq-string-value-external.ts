export function* ternaryBooleanGeneratorFunctionCondEqStringValueExternal(): Generator<string> {
    yield (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
}
