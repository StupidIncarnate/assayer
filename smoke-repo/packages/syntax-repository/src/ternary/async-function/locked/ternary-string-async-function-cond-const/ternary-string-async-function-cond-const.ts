const cond: string = 'abc';

export async function ternaryStringAsyncFunctionCondConst(): Promise<string> {
    await Promise.resolve();
    return cond ? 'then' : 'else';
}
