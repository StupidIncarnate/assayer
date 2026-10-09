export async function ifNumberAsyncFunctionCondArrayLengthNumberReceiverParam(receiver: readonly number[]): Promise<string> {
    await Promise.resolve();
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
