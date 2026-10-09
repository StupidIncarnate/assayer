const receiver: readonly string[] = ['a', 'b', 'c'];

export async function ternaryNumberAsyncFunctionCondArrayLengthStringReceiverConst(): Promise<string> {
    await Promise.resolve();
    return receiver.length ? 'then' : 'else';
}
