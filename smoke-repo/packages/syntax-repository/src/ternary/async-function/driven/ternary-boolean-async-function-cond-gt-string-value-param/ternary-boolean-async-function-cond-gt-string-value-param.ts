export async function ternaryBooleanAsyncFunctionCondGtStringValueParam(value: string): Promise<string> {
    await Promise.resolve();
    return value > 'm' ? 'then' : 'else';
}
