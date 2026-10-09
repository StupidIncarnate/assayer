export async function ifNumberAsyncFunctionCondStringLengthReceiverExternal(): Promise<string> {
    await Promise.resolve();
    if ((process.argv[2] ?? '').length) {
        return 'then';
    }
    return 'else';
}
