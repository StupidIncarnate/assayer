export function* ternaryBooleanGeneratorFunctionCondNotBooleanValueParam(value: boolean): Generator<string> {
    yield !value ? 'then' : 'else';
}
