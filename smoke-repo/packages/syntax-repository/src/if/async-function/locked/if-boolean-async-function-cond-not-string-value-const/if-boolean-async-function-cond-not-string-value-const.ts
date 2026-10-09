const value: string = 'abc';

export async function ifBooleanAsyncFunctionCondNotStringValueConst(): Promise<string> {
    await Promise.resolve();
    if (!value) {
        return 'then';
    }
    return 'else';
}
