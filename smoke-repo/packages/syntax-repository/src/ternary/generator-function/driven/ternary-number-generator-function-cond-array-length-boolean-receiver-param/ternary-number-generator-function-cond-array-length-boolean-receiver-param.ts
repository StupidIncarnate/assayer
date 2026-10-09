export function* ternaryNumberGeneratorFunctionCondArrayLengthBooleanReceiverParam(receiver: readonly boolean[]): Generator<string> {
    yield receiver.length ? 'then' : 'else';
}
