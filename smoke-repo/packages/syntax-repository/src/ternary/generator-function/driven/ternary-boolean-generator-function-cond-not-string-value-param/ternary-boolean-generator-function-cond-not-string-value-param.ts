export function* ternaryBooleanGeneratorFunctionCondNotStringValueParam(value: string): Generator<string> {
    yield !value ? 'then' : 'else';
}
