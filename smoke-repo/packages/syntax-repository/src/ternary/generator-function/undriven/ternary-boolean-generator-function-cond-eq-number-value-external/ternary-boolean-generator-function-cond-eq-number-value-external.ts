export function* ternaryBooleanGeneratorFunctionCondEqNumberValueExternal(): Generator<string> {
    yield Number(process.argv[2]) === 7 ? 'then' : 'else';
}
