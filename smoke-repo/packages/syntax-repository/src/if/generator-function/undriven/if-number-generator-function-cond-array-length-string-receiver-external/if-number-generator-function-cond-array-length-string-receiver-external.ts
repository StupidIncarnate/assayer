export function* ifNumberGeneratorFunctionCondArrayLengthStringReceiverExternal(): Generator<string> {
    if (process.argv.slice(2).length) {
        yield 'then';
    }
    yield 'else';
}
