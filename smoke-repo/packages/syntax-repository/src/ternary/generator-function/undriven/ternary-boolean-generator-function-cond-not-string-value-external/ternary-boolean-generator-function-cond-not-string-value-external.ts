export function* ternaryBooleanGeneratorFunctionCondNotStringValueExternal(): Generator<string> {
    yield !(process.argv[2] ?? '') ? 'then' : 'else';
}
