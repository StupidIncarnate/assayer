export function* ternaryBooleanGeneratorFunctionCondGtStringValueExternal(): Generator<string> {
    yield (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
}
