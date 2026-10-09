export function* ifBooleanGeneratorFunctionCondParam(cond: boolean): Generator<string> {
    if (cond) {
        yield 'then';
    }
    yield 'else';
}
