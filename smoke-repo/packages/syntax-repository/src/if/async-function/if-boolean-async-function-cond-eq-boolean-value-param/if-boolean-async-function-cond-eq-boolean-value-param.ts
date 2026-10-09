export async function ifBooleanAsyncFunctionCondEqBooleanValueParam(value: boolean): Promise<string> {
    await Promise.resolve();
    if (value === false) {
        return 'then';
    }
    return 'else';
}
