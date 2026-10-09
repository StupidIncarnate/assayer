export async function ternaryBooleanAsyncFunctionCondEqNumberValueExternal(): Promise<string> {
    await Promise.resolve();
    return Number(process.argv[2]) === 7 ? 'then' : 'else';
}
