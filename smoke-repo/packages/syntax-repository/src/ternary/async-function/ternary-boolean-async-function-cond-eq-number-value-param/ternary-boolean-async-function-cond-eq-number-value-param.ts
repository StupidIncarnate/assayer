export async function ternaryBooleanAsyncFunctionCondEqNumberValueParam(value: number): Promise<string> {
    await Promise.resolve();
    return value === 7 ? 'then' : 'else';
}
