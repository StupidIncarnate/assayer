export async function ifBooleanAsyncFunctionCondGtNumberValueExternal(): Promise<string> {
    await Promise.resolve();
    if (Number(process.argv[2]) > 5) {
        return 'then';
    }
    return 'else';
}
