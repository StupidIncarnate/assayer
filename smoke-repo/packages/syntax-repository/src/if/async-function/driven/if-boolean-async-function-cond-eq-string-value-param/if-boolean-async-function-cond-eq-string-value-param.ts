export async function ifBooleanAsyncFunctionCondEqStringValueParam(value: string): Promise<string> {
    await Promise.resolve();
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
}
