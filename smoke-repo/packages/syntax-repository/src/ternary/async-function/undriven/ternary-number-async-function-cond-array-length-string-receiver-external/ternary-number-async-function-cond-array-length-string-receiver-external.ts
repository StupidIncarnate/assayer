export async function ternaryNumberAsyncFunctionCondArrayLengthStringReceiverExternal(): Promise<string> {
    await Promise.resolve();
    return process.argv.slice(2).length ? 'then' : 'else';
}
