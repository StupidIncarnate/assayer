export function* ternaryBooleanGeneratorFunctionCondNotNumberValueParam(value: number): Generator<string> {
    yield !value ? 'then' : 'else';
}
