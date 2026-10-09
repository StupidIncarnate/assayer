export async function ifBooleanAsyncFunctionCondParam(cond: boolean): Promise<string> {
    await Promise.resolve();
    if (cond) {
        return 'then';
    }
    return 'else';
}
