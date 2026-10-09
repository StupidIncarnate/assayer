const value: string = 'abc';

export async function ternaryBooleanAsyncFunctionCondGtStringValueConst(): Promise<string> {
    await Promise.resolve();
    return value > 'm' ? 'then' : 'else';
}
