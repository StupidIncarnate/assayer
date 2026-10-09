export async function ternaryNumberAsyncFunctionCondStringLengthReceiverExternal(): Promise<string> {
    await Promise.resolve();
    return (process.argv[2] ?? '').length ? 'then' : 'else';
}
