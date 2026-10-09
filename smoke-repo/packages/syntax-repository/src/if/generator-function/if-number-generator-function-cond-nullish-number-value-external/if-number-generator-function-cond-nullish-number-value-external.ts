export function* ifNumberGeneratorFunctionCondNullishNumberValueExternal(): Generator<string> {
    if ((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) {
        yield 'then';
    }
    yield 'else';
}
