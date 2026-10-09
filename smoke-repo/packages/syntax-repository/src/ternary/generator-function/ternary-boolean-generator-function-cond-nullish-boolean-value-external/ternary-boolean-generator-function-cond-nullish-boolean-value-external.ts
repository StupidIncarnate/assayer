export function* ternaryBooleanGeneratorFunctionCondNullishBooleanValueExternal(): Generator<string> {
    yield (process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false ? 'then' : 'else';
}
