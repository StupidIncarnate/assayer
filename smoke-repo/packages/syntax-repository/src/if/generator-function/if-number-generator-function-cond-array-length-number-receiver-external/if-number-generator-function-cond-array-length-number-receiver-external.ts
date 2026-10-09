export function* ifNumberGeneratorFunctionCondArrayLengthNumberReceiverExternal(): Generator<string> {
    if (process.argv.slice(2).map(Number).length) {
        yield 'then';
    }
    yield 'else';
}
