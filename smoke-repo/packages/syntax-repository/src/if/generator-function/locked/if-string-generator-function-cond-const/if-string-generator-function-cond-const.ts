const cond: string = 'abc';

export function* ifStringGeneratorFunctionCondConst(): Generator<string> {
    if (cond) {
        yield 'then';
    }
    yield 'else';
}
