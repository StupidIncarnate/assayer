export async function ifBooleanAsyncFunctionCondEqNumberValueExternal(): Promise<string> {
    await Promise.resolve();
    if (Number(process.argv[2]) === 7) {
        return 'then';
    }
    return 'else';
}
