export async function ternaryNumberAsyncFunctionCondArrayLengthStringReceiverParam(receiver: readonly string[]): Promise<string> {
    await Promise.resolve();
    return receiver.length ? 'then' : 'else';
}
