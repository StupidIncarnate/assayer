export async function ternaryNumberAsyncFunctionCondStringLengthReceiverParam(receiver: string): Promise<string> {
    await Promise.resolve();
    return receiver.length ? 'then' : 'else';
}
