const cond: string = 'abc';

export async function ifStringAsyncFunctionCondConst(): Promise<string> {
    await Promise.resolve();
    if (cond) {
        return 'then';
    }
    return 'else';
}
