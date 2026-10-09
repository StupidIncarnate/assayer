export function* ifBooleanGeneratorFunctionCondNullishBooleanValueExternal(): Generator<string> {
    if ((process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false) {
        yield 'then';
    }
    yield 'else';
}
