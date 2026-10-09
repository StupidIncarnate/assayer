export async function ifBooleanAsyncFunctionCondNotNumberValueExternal(): Promise<string> {
    await Promise.resolve();
    if (!Number(process.argv[2])) {
        return 'then';
    }
    return 'else';
}
