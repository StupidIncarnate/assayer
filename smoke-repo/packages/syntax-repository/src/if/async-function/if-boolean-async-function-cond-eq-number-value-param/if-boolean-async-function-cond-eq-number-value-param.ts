export async function ifBooleanAsyncFunctionCondEqNumberValueParam(value: number): Promise<string> {
    await Promise.resolve();
    if (value === 7) {
        return 'then';
    }
    return 'else';
}
