export function* ternaryBooleanGeneratorFunctionCondParam(cond: boolean): Generator<string> {
    yield cond ? 'then' : 'else';
}
