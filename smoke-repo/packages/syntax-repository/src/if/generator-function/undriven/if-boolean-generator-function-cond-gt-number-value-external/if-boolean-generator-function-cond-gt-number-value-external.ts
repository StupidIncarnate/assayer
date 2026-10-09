export function* ifBooleanGeneratorFunctionCondGtNumberValueExternal(): Generator<string> {
    if (Number(process.argv[2]) > 5) {
        yield 'then';
    }
    yield 'else';
}
