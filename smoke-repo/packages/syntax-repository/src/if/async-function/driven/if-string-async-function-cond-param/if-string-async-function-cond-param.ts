export async function ifStringAsyncFunctionCondParam(cond: string): Promise<string> {
    await Promise.resolve();
    if (cond) {
        return 'then';
    }
    return 'else';
}
