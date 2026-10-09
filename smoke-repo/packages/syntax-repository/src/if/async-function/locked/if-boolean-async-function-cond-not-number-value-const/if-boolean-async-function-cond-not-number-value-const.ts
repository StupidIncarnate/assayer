const value: number = 3;

export async function ifBooleanAsyncFunctionCondNotNumberValueConst(): Promise<string> {
    await Promise.resolve();
    if (!value) {
        return 'then';
    }
    return 'else';
}
