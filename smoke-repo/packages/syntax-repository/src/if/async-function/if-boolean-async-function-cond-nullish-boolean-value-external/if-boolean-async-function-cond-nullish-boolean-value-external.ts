export async function ifBooleanAsyncFunctionCondNullishBooleanValueExternal(): Promise<string> {
    await Promise.resolve();
    if ((process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false) {
        return 'then';
    }
    return 'else';
}
