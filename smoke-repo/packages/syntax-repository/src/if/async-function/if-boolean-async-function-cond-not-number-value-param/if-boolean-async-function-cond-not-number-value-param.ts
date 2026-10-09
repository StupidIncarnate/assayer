export async function ifBooleanAsyncFunctionCondNotNumberValueParam(value: number): Promise<string> {
    await Promise.resolve();
    if (!value) {
        return 'then';
    }
    return 'else';
}
