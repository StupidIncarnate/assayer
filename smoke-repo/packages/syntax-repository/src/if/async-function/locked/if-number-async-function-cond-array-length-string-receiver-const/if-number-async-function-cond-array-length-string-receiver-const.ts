const receiver: readonly string[] = ['a', 'b', 'c'];

export async function ifNumberAsyncFunctionCondArrayLengthStringReceiverConst(): Promise<string> {
    await Promise.resolve();
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
