const cond: boolean = true;

export async function ifBooleanAsyncFunctionCondConst(): Promise<string> {
    await Promise.resolve();
    if (cond) {
        return 'then';
    }
    return 'else';
}
