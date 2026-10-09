export async function ternaryBooleanAsyncFunctionCondEqBooleanValueExternal(): Promise<string> {
    await Promise.resolve();
    return process.argv[2] === 'yes' === false ? 'then' : 'else';
}
