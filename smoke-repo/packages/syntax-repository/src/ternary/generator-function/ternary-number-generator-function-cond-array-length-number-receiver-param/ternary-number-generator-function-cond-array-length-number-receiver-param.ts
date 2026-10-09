export function* ternaryNumberGeneratorFunctionCondArrayLengthNumberReceiverParam(receiver: readonly number[]): Generator<string> {
    yield receiver.length ? 'then' : 'else';
}
