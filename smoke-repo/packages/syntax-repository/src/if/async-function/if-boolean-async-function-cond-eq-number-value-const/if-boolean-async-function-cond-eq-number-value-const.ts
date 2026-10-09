const value: number = 3;

export async function ifBooleanAsyncFunctionCondEqNumberValueConst(): Promise<string> {
    await Promise.resolve();
    if (value === 7) {
        return 'then';
    }
    return 'else';
}
