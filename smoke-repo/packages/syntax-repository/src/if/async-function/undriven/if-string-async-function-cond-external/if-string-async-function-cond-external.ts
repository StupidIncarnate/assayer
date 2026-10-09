export async function ifStringAsyncFunctionCondExternal(): Promise<string> {
    await Promise.resolve();
    if (process.argv[2] ?? '') {
        return 'then';
    }
    return 'else';
}
