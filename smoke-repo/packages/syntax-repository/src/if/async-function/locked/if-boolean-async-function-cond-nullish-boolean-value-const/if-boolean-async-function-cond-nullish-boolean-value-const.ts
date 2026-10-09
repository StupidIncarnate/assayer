const value: boolean | undefined = true;

export async function ifBooleanAsyncFunctionCondNullishBooleanValueConst(): Promise<string> {
    await Promise.resolve();
    if (value ?? false) {
        return 'then';
    }
    return 'else';
}
