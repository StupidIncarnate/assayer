export async function ifBooleanAsyncFunctionCondGtNumberValueParam(value: number): Promise<string> {
    await Promise.resolve();
    if (value > 5) {
        return 'then';
    }
    return 'else';
}
