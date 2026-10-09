const value: number = 3;

export async function ternaryBooleanAsyncFunctionCondNotNumberValueConst(): Promise<string> {
    await Promise.resolve();
    return !value ? 'then' : 'else';
}
