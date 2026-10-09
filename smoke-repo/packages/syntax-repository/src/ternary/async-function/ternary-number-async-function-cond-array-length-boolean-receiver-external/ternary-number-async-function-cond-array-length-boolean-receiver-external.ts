export async function ternaryNumberAsyncFunctionCondArrayLengthBooleanReceiverExternal(): Promise<string> {
    await Promise.resolve();
    return process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
}
