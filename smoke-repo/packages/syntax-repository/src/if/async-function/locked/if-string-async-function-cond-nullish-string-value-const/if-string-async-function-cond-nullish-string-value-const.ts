const value: string | undefined = 'abc';

export async function ifStringAsyncFunctionCondNullishStringValueConst(): Promise<string> {
    await Promise.resolve();
    if (value ?? '') {
        return 'then';
    }
    return 'else';
}
