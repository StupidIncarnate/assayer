export function* ternaryNumberGeneratorFunctionCondArrayLengthStringReceiverParam(receiver: readonly string[]): Generator<string> {
    yield receiver.length ? 'then' : 'else';
}
