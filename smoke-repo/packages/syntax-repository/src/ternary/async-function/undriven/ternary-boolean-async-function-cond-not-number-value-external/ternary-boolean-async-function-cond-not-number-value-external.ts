export async function ternaryBooleanAsyncFunctionCondNotNumberValueExternal(): Promise<string> {
    await Promise.resolve();
    return !Number(process.argv[2]) ? 'then' : 'else';
}
