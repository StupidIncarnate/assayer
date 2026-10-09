export async function ifStringAsyncFunctionCondNullishStringValueExternal(): Promise<string> {
    await Promise.resolve();
    if ((process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '') {
        return 'then';
    }
    return 'else';
}
