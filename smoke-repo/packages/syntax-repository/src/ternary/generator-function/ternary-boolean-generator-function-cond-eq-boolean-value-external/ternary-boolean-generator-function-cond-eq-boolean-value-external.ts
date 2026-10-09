export function* ternaryBooleanGeneratorFunctionCondEqBooleanValueExternal(): Generator<string> {
    yield process.argv[2] === 'yes' === false ? 'then' : 'else';
}
