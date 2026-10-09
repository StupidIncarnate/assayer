const receiver: readonly string[] = ['a', 'b', 'c'];

export function* ternaryNumberGeneratorFunctionCondArrayLengthStringReceiverConst(): Generator<string> {
    yield receiver.length ? 'then' : 'else';
}
