export async function ifBooleanAsyncFunctionCondNotStringValueParam(value: string): Promise<string> {
    await Promise.resolve();
    if (!value) {
        return 'then';
    }
    return 'else';
}
