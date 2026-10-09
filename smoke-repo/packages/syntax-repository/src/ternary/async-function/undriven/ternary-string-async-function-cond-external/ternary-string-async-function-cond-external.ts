export async function ternaryStringAsyncFunctionCondExternal(): Promise<string> {
    await Promise.resolve();
    return process.argv[2] ?? '' ? 'then' : 'else';
}
