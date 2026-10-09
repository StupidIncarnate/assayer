const cond: number = 3;

export async function ternaryNumberAsyncFunctionCondConst(): Promise<string> {
    await Promise.resolve();
    return cond ? 'then' : 'else';
}
