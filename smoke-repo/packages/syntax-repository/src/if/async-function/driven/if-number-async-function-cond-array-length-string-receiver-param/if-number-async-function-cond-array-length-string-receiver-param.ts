export async function ifNumberAsyncFunctionCondArrayLengthStringReceiverParam(receiver: readonly string[]): Promise<string> {
    await Promise.resolve();
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
