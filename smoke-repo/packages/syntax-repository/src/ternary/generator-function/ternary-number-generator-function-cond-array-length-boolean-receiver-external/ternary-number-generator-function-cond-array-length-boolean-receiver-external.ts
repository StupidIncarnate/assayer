export function* ternaryNumberGeneratorFunctionCondArrayLengthBooleanReceiverExternal(): Generator<string> {
    yield process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
}
