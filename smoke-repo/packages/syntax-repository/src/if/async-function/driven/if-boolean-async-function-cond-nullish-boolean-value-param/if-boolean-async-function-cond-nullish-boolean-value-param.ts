export async function ifBooleanAsyncFunctionCondNullishBooleanValueParam(value: boolean | undefined): Promise<string> {
    await Promise.resolve();
    if (value ?? false) {
        return 'then';
    }
    return 'else';
}
