const cond: boolean = true;

export function* ifBooleanGeneratorFunctionCondConst(): Generator<string> {
    if (cond) {
        yield 'then';
    }
    yield 'else';
}
