export async function ternaryBooleanAsyncFunctionCondGtStringValueExternal(): Promise<string> {
    await Promise.resolve();
    return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
}
