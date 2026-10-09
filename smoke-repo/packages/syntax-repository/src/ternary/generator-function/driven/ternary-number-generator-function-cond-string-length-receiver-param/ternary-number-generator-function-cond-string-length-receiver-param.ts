export function* ternaryNumberGeneratorFunctionCondStringLengthReceiverParam(receiver: string): Generator<string> {
    yield receiver.length ? 'then' : 'else';
}
