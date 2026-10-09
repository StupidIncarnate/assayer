export function* ifStringGeneratorFunctionCondParam(cond: string): Generator<string> {
    if (cond) {
        yield 'then';
    }
    yield 'else';
}
