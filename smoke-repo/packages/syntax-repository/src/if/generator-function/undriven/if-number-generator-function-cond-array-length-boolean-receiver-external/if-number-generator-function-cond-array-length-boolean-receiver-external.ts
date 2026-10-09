export function* ifNumberGeneratorFunctionCondArrayLengthBooleanReceiverExternal(): Generator<string> {
    if (process.argv.slice(2).map(arg => arg === 'yes').length) {
        yield 'then';
    }
    yield 'else';
}
