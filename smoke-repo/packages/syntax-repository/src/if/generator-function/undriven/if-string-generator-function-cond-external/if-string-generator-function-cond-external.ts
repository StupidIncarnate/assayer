export function* ifStringGeneratorFunctionCondExternal(): Generator<string> {
    if (process.argv[2] ?? '') {
        yield 'then';
    }
    yield 'else';
}
