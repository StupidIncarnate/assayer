const receiver: readonly number[] = [10, 20, 30];

export function* ifNumberGeneratorFunctionCondArrayLengthNumberReceiverConst(): Generator<string> {
    if (receiver.length) {
        yield 'then';
    }
    yield 'else';
}
