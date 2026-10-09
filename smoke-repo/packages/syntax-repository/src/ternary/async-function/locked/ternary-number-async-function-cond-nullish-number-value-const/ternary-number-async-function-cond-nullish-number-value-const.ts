const value: number | undefined = 3;

export async function ternaryNumberAsyncFunctionCondNullishNumberValueConst(): Promise<string> {
    await Promise.resolve();
    return value ?? 0 ? 'then' : 'else';
}
