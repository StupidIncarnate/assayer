const value: boolean = true;

export async function ifBooleanAsyncFunctionCondNotBooleanValueConst(): Promise<string> {
    await Promise.resolve();
    if (!value) {
        return 'then';
    }
    return 'else';
}
