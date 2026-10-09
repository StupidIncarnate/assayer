const receiver: readonly number[] = [10, 20, 30];

export async function ternaryNumberAsyncFunctionCondArrayLengthNumberReceiverConst(): Promise<string> {
    await Promise.resolve();
    return receiver.length ? 'then' : 'else';
}
