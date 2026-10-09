export async function ifBooleanAsyncFunctionCondGtStringValueExternal(): Promise<string> {
    await Promise.resolve();
    if ((process.argv[2] ?? '') > 'm') {
        return 'then';
    }
    return 'else';
}
