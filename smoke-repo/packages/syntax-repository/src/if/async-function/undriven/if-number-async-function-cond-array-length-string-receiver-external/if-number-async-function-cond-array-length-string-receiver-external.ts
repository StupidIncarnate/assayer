export async function ifNumberAsyncFunctionCondArrayLengthStringReceiverExternal(): Promise<string> {
    await Promise.resolve();
    if (process.argv.slice(2).length) {
        return 'then';
    }
    return 'else';
}
