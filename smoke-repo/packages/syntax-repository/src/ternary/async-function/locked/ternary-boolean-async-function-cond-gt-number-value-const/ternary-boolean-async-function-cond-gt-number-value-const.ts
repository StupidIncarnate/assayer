const value: number = 3;

export async function ternaryBooleanAsyncFunctionCondGtNumberValueConst(): Promise<string> {
    await Promise.resolve();
    return value > 5 ? 'then' : 'else';
}
