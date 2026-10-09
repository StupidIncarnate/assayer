export function* ifNumberGeneratorFunctionCondStringLengthReceiverParam(receiver: string): Generator<string> {
    if (receiver.length) {
        yield 'then';
    }
    yield 'else';
}
