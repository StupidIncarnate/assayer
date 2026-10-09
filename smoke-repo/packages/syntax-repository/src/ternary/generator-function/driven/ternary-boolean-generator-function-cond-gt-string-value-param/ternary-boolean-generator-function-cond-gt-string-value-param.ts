export function* ternaryBooleanGeneratorFunctionCondGtStringValueParam(value: string): Generator<string> {
    yield value > 'm' ? 'then' : 'else';
}
