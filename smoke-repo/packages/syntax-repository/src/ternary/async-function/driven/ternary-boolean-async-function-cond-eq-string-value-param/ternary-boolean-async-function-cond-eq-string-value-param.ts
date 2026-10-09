export async function ternaryBooleanAsyncFunctionCondEqStringValueParam(value: string): Promise<string> {
    await Promise.resolve();
    return value === 'xyz' ? 'then' : 'else';
}
