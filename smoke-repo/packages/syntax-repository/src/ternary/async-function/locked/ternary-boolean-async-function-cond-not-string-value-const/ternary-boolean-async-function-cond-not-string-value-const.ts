const value: string = 'abc';

export async function ternaryBooleanAsyncFunctionCondNotStringValueConst(): Promise<string> {
    await Promise.resolve();
    return !value ? 'then' : 'else';
}
