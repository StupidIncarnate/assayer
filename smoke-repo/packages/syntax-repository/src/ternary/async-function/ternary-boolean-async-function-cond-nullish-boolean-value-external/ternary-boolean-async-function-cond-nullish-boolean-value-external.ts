export async function ternaryBooleanAsyncFunctionCondNullishBooleanValueExternal(): Promise<string> {
    await Promise.resolve();
    return (process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false ? 'then' : 'else';
}
