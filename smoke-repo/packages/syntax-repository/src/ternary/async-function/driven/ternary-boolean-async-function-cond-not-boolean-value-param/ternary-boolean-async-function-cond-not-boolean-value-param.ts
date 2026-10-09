export async function ternaryBooleanAsyncFunctionCondNotBooleanValueParam(value: boolean): Promise<string> {
    await Promise.resolve();
    return !value ? 'then' : 'else';
}
