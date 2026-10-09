export function* ifNumberGeneratorFunctionCondArrayLengthStringReceiverParam(receiver: readonly string[]): Generator<string> {
    if (receiver.length) {
        yield 'then';
    }
    yield 'else';
}
