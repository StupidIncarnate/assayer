export async function ifBooleanAsyncFunctionCondNotBooleanValueExternal(): Promise<string> {
    await Promise.resolve();
    if (!(process.argv[2] === 'yes')) {
        return 'then';
    }
    return 'else';
}
