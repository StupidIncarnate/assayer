export function* ifStringGeneratorFunctionCondNullishStringValueExternal(): Generator<string> {
    if ((process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '') {
        yield 'then';
    }
    yield 'else';
}
