export function* ifBooleanGeneratorFunctionCondEqBooleanValueExternal(): Generator<string> {
    if (process.argv[2] === 'yes' === false) {
        yield 'then';
    }
    yield 'else';
}
