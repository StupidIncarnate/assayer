const value: number = 3;

export async function ternaryBooleanAsyncFunctionCondEqNumberValueConst(): Promise<string> {
    await Promise.resolve();
    return value === 7 ? 'then' : 'else';
}
