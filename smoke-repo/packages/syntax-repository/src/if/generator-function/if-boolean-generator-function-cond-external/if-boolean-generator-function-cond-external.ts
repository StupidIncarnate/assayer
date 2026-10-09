export function* ifBooleanGeneratorFunctionCondExternal(): Generator<string> {
    if (process.argv[2] === 'yes') {
        yield 'then';
    }
    yield 'else';
}
