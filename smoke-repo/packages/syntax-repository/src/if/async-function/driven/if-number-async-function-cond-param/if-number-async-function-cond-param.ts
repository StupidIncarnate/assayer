export async function ifNumberAsyncFunctionCondParam(cond: number): Promise<string> {
    await Promise.resolve();
    if (cond) {
        return 'then';
    }
    return 'else';
}
