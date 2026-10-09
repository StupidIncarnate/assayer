export async function ternaryBooleanAsyncFunctionCondParam(cond: boolean): Promise<string> {
    await Promise.resolve();
    return cond ? 'then' : 'else';
}
