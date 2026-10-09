export async function ternaryNumberAsyncFunctionCondNullishNumberValueExternal(): Promise<string> {
    await Promise.resolve();
    return (process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0 ? 'then' : 'else';
}
