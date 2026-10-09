export async function ifBooleanAsyncFunctionCondNotStringValueExternal(): Promise<string> {
    await Promise.resolve();
    if (!(process.argv[2] ?? '')) {
        return 'then';
    }
    return 'else';
}
