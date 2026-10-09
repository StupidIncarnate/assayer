const receiver: readonly string[] = ['a', 'b', 'c'];

export function* ifNumberGeneratorFunctionCondArrayLengthStringReceiverConst(): Generator<string> {
    if (receiver.length) {
        yield 'then';
    }
    yield 'else';
}
