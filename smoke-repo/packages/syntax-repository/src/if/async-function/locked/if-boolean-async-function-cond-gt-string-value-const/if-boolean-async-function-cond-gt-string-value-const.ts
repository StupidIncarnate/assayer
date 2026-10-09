const value: string = 'abc';

export async function ifBooleanAsyncFunctionCondGtStringValueConst(): Promise<string> {
    await Promise.resolve();
    if (value > 'm') {
        return 'then';
    }
    return 'else';
}
