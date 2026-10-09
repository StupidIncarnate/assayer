export function* ifNumberGeneratorFunctionCondParam(cond: number): Generator<string> {
    if (cond) {
        yield 'then';
    }
    yield 'else';
}
