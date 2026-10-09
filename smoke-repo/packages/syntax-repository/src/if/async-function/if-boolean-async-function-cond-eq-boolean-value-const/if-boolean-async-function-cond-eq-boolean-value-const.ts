const value: boolean = true;

export async function ifBooleanAsyncFunctionCondEqBooleanValueConst(): Promise<string> {
    await Promise.resolve();
    if (value === false) {
        return 'then';
    }
    return 'else';
}
