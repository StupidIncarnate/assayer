const value: string = 'abc';

export async function ternaryBooleanAsyncFunctionCondEqStringValueConst(): Promise<string> {
    await Promise.resolve();
    return value === 'xyz' ? 'then' : 'else';
}
