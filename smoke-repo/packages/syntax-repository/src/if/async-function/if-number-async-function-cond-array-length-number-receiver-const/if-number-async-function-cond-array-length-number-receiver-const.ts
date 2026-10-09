const receiver: readonly number[] = [10, 20, 30];

export async function ifNumberAsyncFunctionCondArrayLengthNumberReceiverConst(): Promise<string> {
    await Promise.resolve();
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
