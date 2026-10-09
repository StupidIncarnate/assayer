const value: boolean | undefined = true;

export async function ternaryBooleanAsyncFunctionCondNullishBooleanValueConst(): Promise<string> {
    await Promise.resolve();
    return value ?? false ? 'then' : 'else';
}
