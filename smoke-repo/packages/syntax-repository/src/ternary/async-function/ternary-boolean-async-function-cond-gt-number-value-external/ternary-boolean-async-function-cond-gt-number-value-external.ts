export async function ternaryBooleanAsyncFunctionCondGtNumberValueExternal(): Promise<string> {
    await Promise.resolve();
    return Number(process.argv[2]) > 5 ? 'then' : 'else';
}
