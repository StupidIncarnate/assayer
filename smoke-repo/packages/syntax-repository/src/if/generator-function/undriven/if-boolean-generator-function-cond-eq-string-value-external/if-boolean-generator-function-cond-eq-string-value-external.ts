export function* ifBooleanGeneratorFunctionCondEqStringValueExternal(): Generator<string> {
    if ((process.argv[2] ?? '') === 'xyz') {
        yield 'then';
    }
    yield 'else';
}
