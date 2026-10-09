const cond: number = 3;

export function* ifNumberGeneratorFunctionCondConst(): Generator<string> {
    if (cond) {
        yield 'then';
    }
    yield 'else';
}
