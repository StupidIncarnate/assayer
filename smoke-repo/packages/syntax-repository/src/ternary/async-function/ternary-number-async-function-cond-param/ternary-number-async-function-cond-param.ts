export async function ternaryNumberAsyncFunctionCondParam(cond: number): Promise<string> {
    await Promise.resolve();
    return cond ? 'then' : 'else';
}
