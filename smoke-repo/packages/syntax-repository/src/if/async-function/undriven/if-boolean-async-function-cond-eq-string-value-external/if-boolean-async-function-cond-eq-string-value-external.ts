export async function ifBooleanAsyncFunctionCondEqStringValueExternal(): Promise<string> {
    await Promise.resolve();
    if ((process.argv[2] ?? '') === 'xyz') {
        return 'then';
    }
    return 'else';
}
