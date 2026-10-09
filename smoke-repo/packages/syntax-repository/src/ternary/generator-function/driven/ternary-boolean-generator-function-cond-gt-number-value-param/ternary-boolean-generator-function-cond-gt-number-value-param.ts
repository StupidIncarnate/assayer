export function* ternaryBooleanGeneratorFunctionCondGtNumberValueParam(value: number): Generator<string> {
    yield value > 5 ? 'then' : 'else';
}
