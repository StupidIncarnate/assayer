export function* ternaryBooleanGeneratorFunctionCondExternal(): Generator<string> {
    yield process.argv[2] === 'yes' ? 'then' : 'else';
}
