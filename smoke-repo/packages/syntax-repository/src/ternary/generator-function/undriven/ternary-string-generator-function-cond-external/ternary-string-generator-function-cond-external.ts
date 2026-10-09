export function* ternaryStringGeneratorFunctionCondExternal(): Generator<string> {
    yield process.argv[2] ?? '' ? 'then' : 'else';
}
