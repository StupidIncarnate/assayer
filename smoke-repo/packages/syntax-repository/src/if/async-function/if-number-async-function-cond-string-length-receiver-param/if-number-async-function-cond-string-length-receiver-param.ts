export async function ifNumberAsyncFunctionCondStringLengthReceiverParam(receiver: string): Promise<string> {
    await Promise.resolve();
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
