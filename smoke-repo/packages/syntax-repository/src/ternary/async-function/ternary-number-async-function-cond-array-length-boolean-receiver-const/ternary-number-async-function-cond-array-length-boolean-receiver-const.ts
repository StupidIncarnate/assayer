const receiver: readonly boolean[] = [true, false, true];

export async function ternaryNumberAsyncFunctionCondArrayLengthBooleanReceiverConst(): Promise<string> {
    await Promise.resolve();
    return receiver.length ? 'then' : 'else';
}
