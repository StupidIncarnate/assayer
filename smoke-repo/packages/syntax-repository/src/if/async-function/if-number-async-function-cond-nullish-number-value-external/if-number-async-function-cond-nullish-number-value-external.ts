export async function ifNumberAsyncFunctionCondNullishNumberValueExternal(): Promise<string> {
    await Promise.resolve();
    if ((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) {
        return 'then';
    }
    return 'else';
}
