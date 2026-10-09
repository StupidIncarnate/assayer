const receiver: string = 'abc';

export async function ifNumberAsyncFunctionCondStringLengthReceiverConst(): Promise<string> {
    await Promise.resolve();
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
