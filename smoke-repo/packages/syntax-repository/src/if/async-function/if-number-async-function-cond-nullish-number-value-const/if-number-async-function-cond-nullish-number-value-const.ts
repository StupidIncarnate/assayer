const value: number | undefined = 3;

export async function ifNumberAsyncFunctionCondNullishNumberValueConst(): Promise<string> {
    await Promise.resolve();
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
}
