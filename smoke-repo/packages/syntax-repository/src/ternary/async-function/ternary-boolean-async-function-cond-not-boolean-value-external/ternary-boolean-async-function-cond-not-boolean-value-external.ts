export async function ternaryBooleanAsyncFunctionCondNotBooleanValueExternal(): Promise<string> {
    await Promise.resolve();
    return !(process.argv[2] === 'yes') ? 'then' : 'else';
}
