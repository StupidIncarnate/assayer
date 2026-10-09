export function* ternaryStringGeneratorFunctionCondNullishStringValueExternal(): Generator<string> {
    yield (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else';
}
