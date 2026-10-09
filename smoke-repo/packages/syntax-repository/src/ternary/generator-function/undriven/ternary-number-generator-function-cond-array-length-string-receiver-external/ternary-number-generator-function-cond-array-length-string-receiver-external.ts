export function* ternaryNumberGeneratorFunctionCondArrayLengthStringReceiverExternal(): Generator<string> {
    yield process.argv.slice(2).length ? 'then' : 'else';
}
