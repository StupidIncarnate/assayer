export async function ternaryBooleanAsyncFunctionCondEqStringValueExternal(): Promise<string> {
    await Promise.resolve();
    return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
}
