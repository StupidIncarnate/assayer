const cond: number = 3;

export async function ifNumberAsyncFunctionCondConst(): Promise<string> {
    await Promise.resolve();
    if (cond) {
        return 'then';
    }
    return 'else';
}
