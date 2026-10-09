export async function ternaryBooleanAsyncFunctionCondNullishBooleanValueParam(value: boolean | undefined): Promise<string> {
    await Promise.resolve();
    return value ?? false ? 'then' : 'else';
}
