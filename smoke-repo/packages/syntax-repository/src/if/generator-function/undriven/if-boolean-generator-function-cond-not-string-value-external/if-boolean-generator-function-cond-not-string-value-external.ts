export function* ifBooleanGeneratorFunctionCondNotStringValueExternal(): Generator<string> {
    if (!(process.argv[2] ?? '')) {
        yield 'then';
    }
    yield 'else';
}
