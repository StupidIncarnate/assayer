const value: number = 3;

export async function ifBooleanAsyncFunctionCondGtNumberValueConst(): Promise<string> {
    await Promise.resolve();
    if (value > 5) {
        return 'then';
    }
    return 'else';
}
