export async function ifNumberAsyncFunctionCondArrayLengthNumberReceiverExternal(): Promise<string> {
    await Promise.resolve();
    if (process.argv.slice(2).map(Number).length) {
        return 'then';
    }
    return 'else';
}
