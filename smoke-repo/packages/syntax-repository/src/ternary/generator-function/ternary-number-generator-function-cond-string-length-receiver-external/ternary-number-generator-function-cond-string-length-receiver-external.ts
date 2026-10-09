export function* ternaryNumberGeneratorFunctionCondStringLengthReceiverExternal(): Generator<string> {
    yield (process.argv[2] ?? '').length ? 'then' : 'else';
}
