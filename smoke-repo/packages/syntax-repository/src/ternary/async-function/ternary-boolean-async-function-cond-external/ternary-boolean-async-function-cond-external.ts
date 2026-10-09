export async function ternaryBooleanAsyncFunctionCondExternal(): Promise<string> {
    await Promise.resolve();
    return process.argv[2] === 'yes' ? 'then' : 'else';
}
