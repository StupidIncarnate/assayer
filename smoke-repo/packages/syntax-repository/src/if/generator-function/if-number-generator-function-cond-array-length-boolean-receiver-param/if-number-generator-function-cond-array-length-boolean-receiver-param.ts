export function* ifNumberGeneratorFunctionCondArrayLengthBooleanReceiverParam(receiver: readonly boolean[]): Generator<string> {
    if (receiver.length) {
        yield 'then';
    }
    yield 'else';
}
