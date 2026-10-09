export async function ternaryNumberAsyncFunctionCondNullishNumberValueParam(value: number | undefined): Promise<string> {
    await Promise.resolve();
    return value ?? 0 ? 'then' : 'else';
}
