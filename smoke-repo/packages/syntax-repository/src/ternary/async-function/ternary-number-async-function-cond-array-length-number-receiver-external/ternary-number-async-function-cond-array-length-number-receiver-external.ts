export async function ternaryNumberAsyncFunctionCondArrayLengthNumberReceiverExternal(): Promise<string> {
    await Promise.resolve();
    return process.argv.slice(2).map(Number).length ? 'then' : 'else';
}
