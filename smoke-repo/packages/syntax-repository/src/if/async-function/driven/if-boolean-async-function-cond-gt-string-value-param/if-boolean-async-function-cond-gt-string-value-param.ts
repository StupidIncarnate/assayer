export async function ifBooleanAsyncFunctionCondGtStringValueParam(value: string): Promise<string> {
    await Promise.resolve();
    if (value > 'm') {
        return 'then';
    }
    return 'else';
}
