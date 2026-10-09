export async function ifNumberAsyncFunctionCondArrayLengthBooleanReceiverParam(receiver: readonly boolean[]): Promise<string> {
    await Promise.resolve();
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
