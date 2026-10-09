export async function ternaryStringAsyncFunctionCondNullishStringValueParam(value: string | undefined): Promise<string> {
    await Promise.resolve();
    return value ?? '' ? 'then' : 'else';
}
