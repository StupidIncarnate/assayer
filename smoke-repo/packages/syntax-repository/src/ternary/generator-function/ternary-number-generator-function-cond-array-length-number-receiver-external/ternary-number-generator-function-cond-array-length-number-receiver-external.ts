export function* ternaryNumberGeneratorFunctionCondArrayLengthNumberReceiverExternal(): Generator<string> {
    yield process.argv.slice(2).map(Number).length ? 'then' : 'else';
}
