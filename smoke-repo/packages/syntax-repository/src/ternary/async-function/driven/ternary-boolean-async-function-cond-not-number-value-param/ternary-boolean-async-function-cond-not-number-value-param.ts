export async function ternaryBooleanAsyncFunctionCondNotNumberValueParam(value: number): Promise<string> {
    await Promise.resolve();
    return !value ? 'then' : 'else';
}
