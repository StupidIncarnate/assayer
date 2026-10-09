export async function ternaryNumberAsyncFunctionCondArrayLengthNumberReceiverParam(receiver: readonly number[]): Promise<string> {
    await Promise.resolve();
    return receiver.length ? 'then' : 'else';
}
