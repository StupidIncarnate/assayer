const receiver: string = 'abc';

export async function ternaryNumberAsyncFunctionCondStringLengthReceiverConst(): Promise<string> {
    await Promise.resolve();
    return receiver.length ? 'then' : 'else';
}
