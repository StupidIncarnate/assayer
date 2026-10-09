export async function ternaryNumberAsyncFunctionCondArrayLengthBooleanReceiverParam(receiver: readonly boolean[]): Promise<string> {
    await Promise.resolve();
    return receiver.length ? 'then' : 'else';
}
