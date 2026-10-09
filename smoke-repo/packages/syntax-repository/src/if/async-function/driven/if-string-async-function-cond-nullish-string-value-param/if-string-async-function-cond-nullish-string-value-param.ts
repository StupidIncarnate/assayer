export async function ifStringAsyncFunctionCondNullishStringValueParam(value: string | undefined): Promise<string> {
    await Promise.resolve();
    if (value ?? '') {
        return 'then';
    }
    return 'else';
}
