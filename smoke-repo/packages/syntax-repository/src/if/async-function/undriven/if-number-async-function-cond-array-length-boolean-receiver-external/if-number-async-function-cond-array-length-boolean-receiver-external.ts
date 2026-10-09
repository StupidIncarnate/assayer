export async function ifNumberAsyncFunctionCondArrayLengthBooleanReceiverExternal(): Promise<string> {
    await Promise.resolve();
    if (process.argv.slice(2).map(arg => arg === 'yes').length) {
        return 'then';
    }
    return 'else';
}
