export async function ternaryBooleanAsyncFunctionCondGtNumberValueParam(value: number): Promise<string> {
    await Promise.resolve();
    return value > 5 ? 'then' : 'else';
}
