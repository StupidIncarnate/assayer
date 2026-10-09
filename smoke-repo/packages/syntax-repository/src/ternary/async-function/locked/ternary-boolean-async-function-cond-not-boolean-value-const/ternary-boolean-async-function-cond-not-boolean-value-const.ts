const value: boolean = true;

export async function ternaryBooleanAsyncFunctionCondNotBooleanValueConst(): Promise<string> {
    await Promise.resolve();
    return !value ? 'then' : 'else';
}
