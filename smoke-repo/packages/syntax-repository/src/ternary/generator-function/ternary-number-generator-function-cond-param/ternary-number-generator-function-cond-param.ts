export function* ternaryNumberGeneratorFunctionCondParam(cond: number): Generator<string> {
    yield cond ? 'then' : 'else';
}
