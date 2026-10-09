export async function ternaryBooleanAsyncFunctionCondNotStringValueParam(value: string): Promise<string> {
    await Promise.resolve();
    return !value ? 'then' : 'else';
}
