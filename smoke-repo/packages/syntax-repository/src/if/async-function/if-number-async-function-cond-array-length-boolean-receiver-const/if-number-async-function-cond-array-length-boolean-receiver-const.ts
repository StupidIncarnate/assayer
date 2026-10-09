const receiver: readonly boolean[] = [true, false, true];

export async function ifNumberAsyncFunctionCondArrayLengthBooleanReceiverConst(): Promise<string> {
    await Promise.resolve();
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
