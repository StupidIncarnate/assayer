const value: string = 'abc';

export async function ifBooleanAsyncFunctionCondEqStringValueConst(): Promise<string> {
    await Promise.resolve();
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
}
