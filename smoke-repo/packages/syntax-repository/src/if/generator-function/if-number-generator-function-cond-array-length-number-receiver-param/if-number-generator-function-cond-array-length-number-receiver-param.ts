export function* ifNumberGeneratorFunctionCondArrayLengthNumberReceiverParam(receiver: readonly number[]): Generator<string> {
    if (receiver.length) {
        yield 'then';
    }
    yield 'else';
}
