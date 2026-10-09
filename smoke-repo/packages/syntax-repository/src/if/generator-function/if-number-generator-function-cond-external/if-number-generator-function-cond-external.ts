export function* ifNumberGeneratorFunctionCondExternal(): Generator<string> {
    if (Number(process.argv[2])) {
        yield 'then';
    }
    yield 'else';
}
