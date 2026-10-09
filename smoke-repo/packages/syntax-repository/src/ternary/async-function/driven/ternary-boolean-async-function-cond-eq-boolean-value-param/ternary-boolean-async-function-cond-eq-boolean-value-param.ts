export async function ternaryBooleanAsyncFunctionCondEqBooleanValueParam(value: boolean): Promise<string> {
    await Promise.resolve();
    return value === false ? 'then' : 'else';
}
