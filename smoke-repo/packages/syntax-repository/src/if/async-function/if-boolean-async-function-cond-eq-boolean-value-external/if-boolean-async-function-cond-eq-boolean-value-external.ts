export async function ifBooleanAsyncFunctionCondEqBooleanValueExternal(): Promise<string> {
    await Promise.resolve();
    if (process.argv[2] === 'yes' === false) {
        return 'then';
    }
    return 'else';
}
