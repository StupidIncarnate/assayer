export async function ternaryStringAsyncFunctionCondNullishStringValueExternal(): Promise<string> {
    await Promise.resolve();
    return (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else';
}
