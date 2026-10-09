export async function ternaryStringAsyncFunctionCondParam(cond: string): Promise<string> {
    await Promise.resolve();
    return cond ? 'then' : 'else';
}
