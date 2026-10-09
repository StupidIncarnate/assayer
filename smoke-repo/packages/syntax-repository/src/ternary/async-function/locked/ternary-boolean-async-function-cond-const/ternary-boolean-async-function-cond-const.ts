const cond: boolean = true;

export async function ternaryBooleanAsyncFunctionCondConst(): Promise<string> {
    await Promise.resolve();
    return cond ? 'then' : 'else';
}
