const value: boolean = true;

export async function ternaryBooleanAsyncFunctionCondEqBooleanValueConst(): Promise<string> {
    await Promise.resolve();
    return value === false ? 'then' : 'else';
}
