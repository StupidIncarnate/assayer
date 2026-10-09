export function* ternaryStringGeneratorFunctionCondParam(cond: string): Generator<string> {
    yield cond ? 'then' : 'else';
}
