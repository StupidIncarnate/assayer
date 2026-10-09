export async function ternaryNumberAsyncFunctionCondExternal(): Promise<string> {
    await Promise.resolve();
    return Number(process.argv[2]) ? 'then' : 'else';
}
