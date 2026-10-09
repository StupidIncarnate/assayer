export async function ifNumberAsyncFunctionCondNullishNumberValueParam(value: number | undefined): Promise<string> {
    await Promise.resolve();
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
}
