const value: string = 'abc';

export function* ifBooleanGeneratorFunctionCondGtStringValueConst(): Generator<string> {
    if (value > 'm') {
        yield 'then';
    }
    yield 'else';
}
