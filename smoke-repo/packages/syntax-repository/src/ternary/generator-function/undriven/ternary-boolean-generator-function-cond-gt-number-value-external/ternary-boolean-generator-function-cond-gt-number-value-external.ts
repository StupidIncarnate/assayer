export function* ternaryBooleanGeneratorFunctionCondGtNumberValueExternal(): Generator<string> {
    yield Number(process.argv[2]) > 5 ? 'then' : 'else';
}
