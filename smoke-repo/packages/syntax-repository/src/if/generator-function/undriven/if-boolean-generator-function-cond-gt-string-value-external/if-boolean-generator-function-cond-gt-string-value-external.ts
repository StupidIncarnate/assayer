export function* ifBooleanGeneratorFunctionCondGtStringValueExternal(): Generator<string> {
    if ((process.argv[2] ?? '') > 'm') {
        yield 'then';
    }
    yield 'else';
}
