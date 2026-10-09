export async function ternaryBooleanAsyncFunctionCondNotStringValueExternal(): Promise<string> {
    await Promise.resolve();
    return !(process.argv[2] ?? '') ? 'then' : 'else';
}
