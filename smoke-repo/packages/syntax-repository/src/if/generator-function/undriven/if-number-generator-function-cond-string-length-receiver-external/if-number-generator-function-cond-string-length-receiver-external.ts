export function* ifNumberGeneratorFunctionCondStringLengthReceiverExternal(): Generator<string> {
    if ((process.argv[2] ?? '').length) {
        yield 'then';
    }
    yield 'else';
}
