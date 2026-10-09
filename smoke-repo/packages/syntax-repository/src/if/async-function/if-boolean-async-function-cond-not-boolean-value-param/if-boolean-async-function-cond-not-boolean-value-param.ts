export async function ifBooleanAsyncFunctionCondNotBooleanValueParam(value: boolean): Promise<string> {
    await Promise.resolve();
    if (!value) {
        return 'then';
    }
    return 'else';
}
