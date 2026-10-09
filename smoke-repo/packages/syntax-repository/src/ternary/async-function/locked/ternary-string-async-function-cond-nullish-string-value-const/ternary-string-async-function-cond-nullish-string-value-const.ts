const value: string | undefined = 'abc';

export async function ternaryStringAsyncFunctionCondNullishStringValueConst(): Promise<string> {
    await Promise.resolve();
    return value ?? '' ? 'then' : 'else';
}
