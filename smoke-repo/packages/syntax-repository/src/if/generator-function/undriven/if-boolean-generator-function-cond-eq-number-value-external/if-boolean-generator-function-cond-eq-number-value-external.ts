export function* ifBooleanGeneratorFunctionCondEqNumberValueExternal(): Generator<string> {
    if (Number(process.argv[2]) === 7) {
        yield 'then';
    }
    yield 'else';
}
